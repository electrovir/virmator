import {type Rule} from 'eslint';
import type {CallExpression, ImportDeclaration} from 'estree';
import {existsSync, readFileSync} from 'node:fs';
import {dirname, isAbsolute, relative, resolve} from 'node:path';

type PackageInfo = {
    dir: string;
    name: string;
};

const packageInfoCache = new Map<string, PackageInfo | undefined>();

function findPackageInfo(currentDir: string): PackageInfo | undefined {
    const candidate = resolve(currentDir, 'package.json');
    if (existsSync(candidate)) {
        const parsed = JSON.parse(readFileSync(candidate, 'utf8')) as {name?: string};
        return {
            dir: currentDir,
            name: parsed.name || currentDir,
        };
    }
    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
        return undefined;
    }
    return findPackageInfo(parentDir);
}

function getPackageInfo(fileDir: string): PackageInfo | undefined {
    const cached = packageInfoCache.get(fileDir);
    if (cached || packageInfoCache.has(fileDir)) {
        return cached;
    }
    const info = findPackageInfo(fileDir);
    packageInfoCache.set(fileDir, info);
    return info;
}

function isRelativeImport(specifier: string): boolean {
    return (
        specifier === '.' ||
        specifier === '..' ||
        specifier.startsWith('./') ||
        specifier.startsWith('../')
    );
}

function isWithinDir(target: string, baseDir: string): boolean {
    if (target === baseDir) {
        return true;
    }
    const rel: string = relative(baseDir, target);
    return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
}

function isTypeOnlyImport(node: ImportDeclaration): boolean {
    const importKind = (node as {importKind?: unknown}).importKind;
    return importKind === 'type';
}

function checkImport(
    context: Rule.RuleContext,
    importPath: string,
    node: ImportDeclaration | CallExpression,
): void {
    if (!isRelativeImport(importPath)) {
        return;
    }

    const fileDir = dirname(context.filename);
    const packageInfo = getPackageInfo(fileDir);
    if (!packageInfo) {
        return;
    }

    const resolvedImport = resolve(fileDir, importPath);
    if (isWithinDir(resolvedImport, packageInfo.dir)) {
        return;
    }

    context.report({
        node,
        messageId: 'reachesOutsidePackage',
        data: {
            importPath,
            packageName: packageInfo.name,
        },
    });
}

const rule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        messages: {
            reachesOutsidePackage:
                'import of "{{importPath}}" reaches outside of the package "{{packageName}}"',
        },
        schema: [],
    },
    create(context) {
        return {
            ImportDeclaration(node: ImportDeclaration) {
                if (isTypeOnlyImport(node)) {
                    return;
                }
                const source = node.source.value;
                if (typeof source !== 'string') {
                    return;
                }
                checkImport(context, source, node);
            },
            CallExpression(node: CallExpression) {
                if (node.callee.type !== 'Identifier' || node.callee.name !== 'require') {
                    return;
                }
                const arg = node.arguments[0];
                if (!arg || arg.type !== 'Literal' || typeof arg.value !== 'string') {
                    return;
                }
                checkImport(context, arg.value, node);
            },
        };
    },
};

export default rule;
