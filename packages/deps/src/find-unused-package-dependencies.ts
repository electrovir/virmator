import {check} from '@augment-vir/assert';
import {getObjectTypedEntries} from '@augment-vir/common';
import {readPackageJson} from '@augment-vir/node';

/** Finds direct package.json dependencies that have no static import in the package's code. */
export async function findUnusedPackageDependencies({
    packageDirPath,
}: Readonly<{
    packageDirPath: string;
}>) {
    /** The plugin installs dependency-cruiser in the consuming package immediately before this runs. */
    /* c8 ignore next */
    const dependencyCruiser = await import('dependency-cruiser');
    const dependencyCruiseOutput = await dependencyCruiser.cruise(['.'], {
        baseDir: packageDirPath,
        doNotFollow: {
            dependencyTypes: [
                'npm',
                'npm-bundled',
                'npm-dev',
                'npm-no-pkg',
                'npm-optional',
                'npm-peer',
                'npm-unknown',
            ],
        },
        exclude: '^(?:dist|dist-[^/]+|coverage|test-files)(?:/|$)',
    });

    /** `cruise` only returns string output when explicitly given an output format, which we do not. */
    /* c8 ignore next 3 */
    if (check.isString(dependencyCruiseOutput.output)) {
        throw new TypeError('Dependency cruiser did not return a dependency graph.');
    }

    const moduleSpecifiers = dependencyCruiseOutput.output.modules
        .filter(({source}) => {
            return !/(?:^\.\.|node_modules\/)/.test(source);
        })
        .flatMap(({dependencies}) => {
            return dependencies.map(({module}) => {
                return module;
            });
        });

    const packageJson = await readPackageJson(packageDirPath);
    const dependencyNames = [
        packageJson.dependencies,
        packageJson.devDependencies,
        packageJson.optionalDependencies,
        packageJson.peerDependencies,
    ].flatMap((dependencies) => {
        return getObjectTypedEntries(dependencies || {}).map(
            ([
                dependencyName,
            ]) => {
                return dependencyName;
            },
        );
    });

    return dependencyNames
        .filter((dependencyName, index) => {
            return (
                dependencyNames.indexOf(dependencyName) === index &&
                !moduleSpecifiers.some((moduleSpecifier) => {
                    return (
                        moduleSpecifier === dependencyName ||
                        moduleSpecifier.startsWith(`${dependencyName}/`)
                    );
                })
            );
        })
        .toSorted();
}
