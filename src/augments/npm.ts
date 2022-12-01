import {extractErrorMessage, RequiredAndNotNullBy} from '@augment-vir/common';
import {existsSync} from 'fs';
import {readFile} from 'fs/promises';
import {dirname, join} from 'path';
import type {PackageJson} from 'type-fest';
import {systemRootPath} from './fs';

export type CleanPackageJson = Readonly<
    RequiredAndNotNullBy<PackageJson.PackageJsonStandard, 'name' | 'version'> & {
        workspaces?: ReadonlyArray<string>;
    }
>;

export function findTopLevelPackageJsonFile(startDir: string): string | undefined {
    if (startDir === systemRootPath) {
        return undefined;
    }

    const topLevelPath = findTopLevelPackageJsonFile(dirname(startDir));
    const currentLevelPath = join(startDir, 'package.json');

    if (topLevelPath) {
        return topLevelPath;
    } else if (existsSync(currentLevelPath)) {
        return currentLevelPath;
    } else {
        return undefined;
    }
}
export async function readPackageJson(packageJsonPath: string): Promise<CleanPackageJson> {
    let parsed: PackageJson;
    try {
        parsed = JSON.parse((await readFile(packageJsonPath)).toString());
    } catch (error) {
        throw new Error(
            `Failed to read package json file "${packageJsonPath}": ${extractErrorMessage(error)}`,
        );
    }

    if (!parsed.name) {
        throw new Error(`Missing package name from "${packageJsonPath}"`);
    }
    if (!parsed.version) {
        throw new Error(`Missing package version from "${packageJsonPath}"`);
    }

    return parsed as CleanPackageJson;
}

export async function readTopLevelPackageJson(
    startDir: string,
): Promise<Readonly<{packageJson: CleanPackageJson; path: string}>> {
    const topLevelPackageJsonPath = findTopLevelPackageJsonFile(startDir);

    if (!topLevelPackageJsonPath) {
        throw new Error(
            `Failed to find package.json path in any ancestor directories from "${startDir}"`,
        );
    }

    return {
        packageJson: await readPackageJson(topLevelPackageJsonPath),
        path: topLevelPackageJsonPath,
    };
}
