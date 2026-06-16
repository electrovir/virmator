import {type MonoRepoPackage} from '@virmator/core';
import {join} from 'node:path';

/**
 * All `node_modules` directories deleted before a regen install: one per mono-repo package plus the
 * mono-repo root. For a single (non-mono) package, `monoRepoPackages` is empty so only the root is
 * returned.
 */
export function listRegenNodeModulesDirs({
    monoRepoRootPath,
    monoRepoPackages,
}: {
    monoRepoRootPath: string;
    monoRepoPackages: ReadonlyArray<Pick<MonoRepoPackage, 'relativePath'>>;
}): string[] {
    return [
        ...monoRepoPackages.map((monoPackage) =>
            join(monoRepoRootPath, monoPackage.relativePath, 'node_modules'),
        ),
        join(monoRepoRootPath, 'node_modules'),
    ];
}
