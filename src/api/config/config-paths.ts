import {join, relative} from 'path';
import {ConfigFileDefinition} from './config-file-definition';

export type GetCopyToPathInputs = {
    repoDir: string;
    packageDir: string;
    configFileDefinition: ConfigFileDefinition;
};

export function getCopyToPath({
    repoDir,
    packageDir,
    configFileDefinition,
}: GetCopyToPathInputs): string {
    return join(
        repoDir,
        configFileDefinition.copyToPathRelativeToRepoDir ??
            relative(packageDir, configFileDefinition.copyFromInternalPath),
    );
}
