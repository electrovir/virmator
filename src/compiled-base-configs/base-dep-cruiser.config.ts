import type {IConfiguration, IForbiddenRuleType} from 'dependency-cruiser';

export function generateDepCruiserConfig({
    fileExceptions,
    omitRules,
}: {
    fileExceptions: Readonly<
        Record<
            string,
            Readonly<
                Partial<{
                    to: ReadonlyArray<string> | undefined;
                    from: ReadonlyArray<string> | undefined;
                }>
            >
        >
    >;
    omitRules: ReadonlyArray<string>;
}) {
    const forbiddenRules = [
        /* rules from the 'recommended' preset: */
        {
            name: 'no-circular',
            severity: 'error',
            comment: 'This dependency is part of a circular relationship.',
            from: {},
            to: {
                circular: true,
            },
        },
        {
            name: 'no-orphans',
            comment:
                "This is an orphan module - it's likely not used (anymore?). Either use it or " +
                "remove it. If it's logical this module is an orphan (i.e. it's a config file), " +
                'add an exception for it in your dependency-cruiser configuration.',
            severity: 'error',
            from: {
                orphan: true,
                pathNot: [
                    '\\.d\\.ts$', // TypeScript declaration files
                ],
            },
            to: {},
        },
        {
            name: 'no-deprecated-core',
            comment:
                'A module depends on a node core module that has been deprecated. Find an alternative - these are ' +
                "bound to exist - node doesn't deprecate lightly.",
            severity: 'error',
            from: {},
            to: {
                dependencyTypes: ['core'],
                path: [
                    '^(v8/tools/codemap)$',
                    '^(v8/tools/consarray)$',
                    '^(v8/tools/csvparser)$',
                    '^(v8/tools/logreader)$',
                    '^(v8/tools/profile_view)$',
                    '^(v8/tools/profile)$',
                    '^(v8/tools/SourceMap)$',
                    '^(v8/tools/splaytree)$',
                    '^(v8/tools/tickprocessor-driver)$',
                    '^(v8/tools/tickprocessor)$',
                    '^(node-inspect/lib/_inspect)$',
                    '^(node-inspect/lib/internal/inspect_client)$',
                    '^(node-inspect/lib/internal/inspect_repl)$',
                    '^(async_hooks)$',
                    '^(punycode)$',
                    '^(domain)$',
                    '^(constants)$',
                    '^(sys)$',
                    '^(_linklist)$',
                    '^(_stream_wrap)$',
                ],
            },
        },
        {
            name: 'not-to-deprecated',
            comment:
                'This module uses a (version of an) npm module that has been deprecated. Either upgrade to a later ' +
                'version of that module, or find an alternative. Deprecated modules are a security risk.',
            severity: 'error',
            from: {},
            to: {
                dependencyTypes: ['deprecated'],
            },
        },
        {
            name: 'no-non-package-json',
            severity: 'error',
            comment:
                "This module depends on an npm package that isn't in the 'dependencies' section of your package.json. " +
                "That's problematic as the package either (1) won't be available on live (2 - worse) will be " +
                'available on live with an non-guaranteed version. Fix it by adding the package to the dependencies ' +
                'in your package.json.',
            from: {},
            to: {
                dependencyTypes: [
                    'npm-no-pkg',
                    'npm-unknown',
                ],
                pathNot: [
                    '^src/',
                ],
            },
        },
        {
            name: 'not-to-unresolvable',
            comment:
                "This module depends on a module that cannot be found ('resolved to disk'). If it's an npm " +
                'module: add it to your package.json. In all other cases you likely already know what to do.',
            severity: 'error',
            from: {},
            to: {
                couldNotResolve: true,
            },
        },
        {
            name: 'no-duplicate-dep-types',
            comment:
                "Likely this module depends on an external ('npm') package that occurs more than once " +
                'in your package.json i.e. both as a devDependencies and in dependencies. This will cause ' +
                'maintenance problems later on.',
            severity: 'error',
            from: {},
            to: {
                moreThanOneDependencyType: true,
                // as it's pretty common to have a type import be a type only import
                // _and_ (e.g.) a devDependency - don't consider type-only dependency
                // types for this rule
                dependencyTypesNot: [
                    'type-only',
                ],
                pathNot: [
                    '^src/',
                ],
            },
        },
        /* rules you might want to tweak for your specific situation: */
        {
            name: 'not-to-spec',
            comment:
                'This module depends on a spec (test) file. The sole responsibility of a spec file is to test code. ' +
                "If there's something in a spec that's of use to other modules, it doesn't have that single " +
                'responsibility anymore. Factor it out into (e.g.) a separate utility/ helper or a mock.',
            severity: 'error',
            from: {},
            to: {
                path: '\\.test\\.ts$',
            },
        },
        {
            name: 'not-to-dev-dep',
            severity: 'error',
            comment:
                "This module depends on an npm package from the 'devDependencies' section of your " +
                'package.json.',
            from: {
                path: '^(packages)',
                pathNot: [
                    '\\.(spec|test)\\.(js|mjs|cjs|ts|ls|coffee|litcoffee|coffee\\.md)$',
                ],
            },
            to: {
                dependencyTypes: ['npm-dev'],
            },
        },
        {
            name: 'optional-deps-used',
            severity: 'error',
            comment:
                'This module depends on an npm package that is declared as an optional dependency ' +
                "in your package.json. As this makes sense in limited situations only, it's flagged here. " +
                "If you're using an optional dependency here by design - add an exception to your" +
                'dependency-cruiser configuration.',
            from: {},
            to: {
                dependencyTypes: ['npm-optional'],
            },
        },
    ] satisfies NonNullable<IConfiguration['forbidden']>;

    Object.entries(fileExceptions).forEach(
        ([
            ruleName,
            fileExceptions,
        ]) => {
            const rule: IForbiddenRuleType | undefined = forbiddenRules.find(
                (rule) => rule.name === ruleName,
            );

            if (!rule) {
                throw new Error(`Rule name not used: '${ruleName}'`);
            }

            const fromPathNot: string[] = rule.from.pathNot
                ? Array.isArray(rule.from.pathNot)
                    ? rule.from.pathNot
                    : [rule.from.pathNot]
                : [];
            const toPathNot: string[] = rule.to.pathNot
                ? Array.isArray(rule.to.pathNot)
                    ? rule.to.pathNot
                    : [rule.to.pathNot]
                : [];

            if (fileExceptions.from?.length) {
                fromPathNot.push(...fileExceptions.from);
            }
            if (fileExceptions.to?.length) {
                toPathNot.push(...fileExceptions.to);
            }

            if (!rule.from.pathNot) {
                (rule.from as {pathNot: string[]}).pathNot = fromPathNot;
            }
            if (!rule.to.pathNot) {
                (rule.to as {pathNot: string[]}).pathNot = toPathNot;
            }
        },
    );

    return {
        forbidden: forbiddenRules.filter((rule) => !omitRules.includes(rule.name)),
        options: {
            doNotFollow: {
                dependencyTypes: [
                    'core',
                    'npm',
                    'npm-bundled',
                    'npm-dev',
                    'npm-no-pkg',
                    'npm-optional',
                    'npm-peer',
                    'npm-unknown',
                ],
            },
            tsPreCompilationDeps: true,
        },
    } satisfies IConfiguration;
}
