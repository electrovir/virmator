import {check} from '@augment-vir/assert';
import NpmPackageJson from '@npmcli/package-json';

/**
 * JSON-serializable results from npm's publish-time package.json checks.
 *
 * @category Util
 */
export type NpmPublishPackageJsonCheckResult = {
    /** The corrections npm would report as publish warnings. */
    warnings: string[];
    /** Errors that prevent npm from checking the package.json. */
    errors: string[];
};

/**
 * Runs npm's package.json normalization used during publishing without changing the source file.
 *
 * @category Internal
 */
export async function checkPackageJsonHealth({
    packageDirPath,
}: Readonly<{
    packageDirPath: string;
}>): Promise<NpmPublishPackageJsonCheckResult> {
    const warnings: string[] = [];

    try {
        const packageJson = await NpmPackageJson.fix(packageDirPath, {
            changes: warnings,
        });
        await packageJson.prepare();

        return {
            warnings,
            errors: [],
        };
    } catch (error) {
        return {
            warnings,
            errors: [
                check.isError(error) ? error.message : String(error),
            ],
        };
    }
}
