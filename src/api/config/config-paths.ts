import {join} from 'path';
import {ConfigFileDefinition} from './config-file-definition';

export type GetCopyToPathInputs = {
    repoDir: string;
    packageDir: string;
    configFileDefinition: ConfigFileDefinition;
};

export function getCopyToPath({repoDir, configFileDefinition}: GetCopyToPathInputs): string {
    return join(repoDir, configFileDefinition.copyToPathRelativeToRepoDir);
}
