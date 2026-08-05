import {type Rule} from 'eslint';
import type {AssignmentExpression, Class, Node} from 'estree';

const functionNodeTypes = [
    'FunctionExpression',
    'FunctionDeclaration',
    'ArrowFunctionExpression',
];

/**
 * Determine whether a class extends an `Error`-like superclass: an `Identifier` whose name ends in
 * `Error` (e.g. `Error`, `MyCustomError`).
 */
function extendsErrorLike(node: Readonly<Class>) {
    return (
        !!node.superClass &&
        node.superClass.type === 'Identifier' &&
        node.superClass.name.endsWith('Error')
    );
}

function isClassNode(node: Readonly<Node>): node is Class {
    return node.type === 'ClassDeclaration' || node.type === 'ClassExpression';
}

/** Determine whether an assignment target is the `this.name` member expression. */
function isThisNameMember(node: AssignmentExpression['left']) {
    return (
        node.type === 'MemberExpression' &&
        node.object.type === 'ThisExpression' &&
        !node.computed &&
        node.property.type === 'Identifier' &&
        node.property.name === 'name'
    );
}

/** Determine whether a class already declares a (non-computed) `name` member. */
function hasNameMember(node: Readonly<Class>) {
    return node.body.body.some((member) => {
        return (
            (member.type === 'PropertyDefinition' || member.type === 'MethodDefinition') &&
            !member.computed &&
            member.key.type === 'Identifier' &&
            member.key.name === 'name'
        );
    });
}

const rule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        fixable: 'code',
        messages: {
            errorNameAsClassField:
                'Override `name` as a class field (`public override readonly name = ...`) instead of assigning `this.name` in the constructor.',
            missingErrorNameField:
                'Declare `name` as a class field (`public override readonly name = ...`) on every `Error` subclass so instances are identifiable in logs.',
        },
        schema: [],
    },
    create(context) {
        /**
         * Classes whose own instance has `this.name` assigned somewhere in their body (constructor,
         * method, or nested arrow). The missing-`name` check skips these: such a class manages
         * `name` imperatively, so inserting a `readonly` field could conflict (an arrow's `this` is
         * the instance, so its `this.name = ...` would write to the new `readonly` field). Only the
         * _nearest_ enclosing class is recorded: a `this.name` inside a nested class targets that
         * inner instance, not the outer one, so it must not suppress the outer class's report.
         */
        const classesAssigningThisName = new Set<Node>();

        function checkMissingNameField(node: Class & Rule.NodeParentExtension) {
            if (
                !extendsErrorLike(node) ||
                hasNameMember(node) ||
                classesAssigningThisName.has(node)
            ) {
                return;
            }

            const className = node.id?.name;
            context.report({
                node: node.id ?? node,
                messageId: 'missingErrorNameField',
                /**
                 * Only autofix when the class name is derivable (named declarations and named class
                 * expressions). Anonymous class expressions are reported without a fix.
                 */
                fix: className
                    ? (fixer) => {
                          const openBrace = context.sourceCode.getFirstToken(node.body);
                          if (!openBrace) {
                              return null;
                          }
                          return fixer.insertTextAfter(
                              openBrace,
                              `\n    public override readonly name = '${className}';`,
                          );
                      }
                    : undefined,
            });
        }

        return {
            AssignmentExpression(node: AssignmentExpression & Rule.NodeParentExtension) {
                if (!isThisNameMember(node.left)) {
                    return;
                }

                const ancestors = context.sourceCode.getAncestors(node);
                const nearestEnclosingClass = ancestors.findLast(isClassNode);
                if (nearestEnclosingClass) {
                    classesAssigningThisName.add(nearestEnclosingClass);
                }

                /**
                 * Gate the report on the assignment's _closest enclosing function_: it must be the
                 * class constructor itself. Tracking only a constructor-depth flag would wrongly
                 * flag `this.name` assignments inside nested functions/methods declared within the
                 * constructor body (e.g. a nested `class Inner { method() { this.name = 'x'; }
                 * }`).
                 */
                const enclosingFunctionIndex = ancestors.findLastIndex((ancestor) => {
                    return functionNodeTypes.includes(ancestor.type);
                });
                if (enclosingFunctionIndex < 0) {
                    return;
                }

                const methodDefinition = ancestors[enclosingFunctionIndex - 1];
                if (
                    methodDefinition?.type !== 'MethodDefinition' ||
                    methodDefinition.kind !== 'constructor'
                ) {
                    return;
                }

                const classBody = ancestors[enclosingFunctionIndex - 2];
                const classNode = ancestors[enclosingFunctionIndex - 3];
                if (
                    !classBody ||
                    !classNode ||
                    !isClassNode(classNode) ||
                    !extendsErrorLike(classNode)
                ) {
                    return;
                }

                const enclosingFunction = ancestors[enclosingFunctionIndex];
                const statement = node.parent;
                /**
                 * Only offer an autofix when the conversion is provably safe: the assignment is a
                 * standalone top-level statement of the constructor body (not nested in a
                 * conditional/loop, so no control flow is lost), its value is a literal (so the
                 * field initializer cannot capture a constructor parameter or local, which run
                 * after field initialization), and the class does not already declare a `name`
                 * member (otherwise inserting a field would duplicate it). Anything else is
                 * reported without a fix.
                 */
                const canAutofix =
                    statement.type === 'ExpressionStatement' &&
                    statement.parent.type === 'BlockStatement' &&
                    statement.parent.parent === enclosingFunction &&
                    node.right.type === 'Literal' &&
                    !hasNameMember(classNode);

                context.report({
                    node,
                    messageId: 'errorNameAsClassField',
                    fix: canAutofix
                        ? (fixer) => {
                              const openBrace = context.sourceCode.getFirstToken(classBody);
                              const tokenBeforeStatement =
                                  context.sourceCode.getTokenBefore(statement);
                              const statementRange = statement.range;
                              /**
                               * Bail out (report without fixing) when required tokens are missing,
                               * or when a comment sits between the previous token and the
                               * assignment: such a comment falls inside the removal range and would
                               * be silently deleted (e.g. `super(); // keep`).
                               */
                              if (
                                  !openBrace ||
                                  !tokenBeforeStatement ||
                                  !statementRange ||
                                  context.sourceCode.getCommentsBefore(statement).length > 0
                              ) {
                                  return null;
                              }
                              const valueText = context.sourceCode.getText(node.right);
                              return [
                                  fixer.insertTextAfter(
                                      openBrace,
                                      `\n    public override readonly name = ${valueText};`,
                                  ),
                                  fixer.removeRange([
                                      tokenBeforeStatement.range[1],
                                      statementRange[1],
                                  ]),
                              ];
                          }
                        : undefined,
                });
            },

            'ClassDeclaration:exit': checkMissingNameField,
            'ClassExpression:exit': checkMissingNameField,
        };
    },
};

export default rule;
