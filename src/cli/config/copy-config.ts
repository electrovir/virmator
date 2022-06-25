import {copyFile, readFile, writeFile} from 'fs/promises';
import {ConfigFileDefinition, doesCopyToConfigPathExist, getCopyToPath} from './config-files';

export enum CopyConfigOperation {
    /** Only update the config file if it exists and is marked as being able to be updated. */
    Update = 'update',
    /** Overwrite config file, even if it already exists in the repo. */
    Overwrite = 'overwrite',
    /** Only write the config file if it doesn't exist already. */
    Init = 'init',
}

export type CopyConfigInputs = {
    configFileDefinition: ConfigFileDefinition;
    repoDir: string;
    operation: CopyConfigOperation;
};

export type CopyConfigOutputs = {
    copiedToPath: string;
    didWrite: boolean;
};

export async function copyConfig(inputs: CopyConfigInputs): Promise<CopyConfigOutputs> {
    const copyFromPath = inputs.configFileDefinition.path;
    const copyToPath = getCopyToPath(inputs.configFileDefinition, inputs.repoDir);
    const copyToFileExists = doesCopyToConfigPathExist(inputs.configFileDefinition, inputs.repoDir);
    let shouldWrite = false;

    switch (inputs.operation) {
        case CopyConfigOperation.Init: {
            if (!copyToFileExists) {
                shouldWrite = true;
            }
            break;
        }
        case CopyConfigOperation.Overwrite: {
            shouldWrite = true;
            break;
        }
        case CopyConfigOperation.Update: {
            if (
                copyToFileExists &&
                typeof inputs.configFileDefinition !== 'string' &&
                inputs.configFileDefinition.canBeUpdated
            ) {
                shouldWrite = true;
            }
            break;
        }
    }

    if (shouldWrite) {
        if (
            inputs.operation === CopyConfigOperation.Update &&
            typeof inputs.configFileDefinition !== 'string' &&
            inputs.configFileDefinition.updateCallback !== undefined
        ) {
            const copyFromContents = (await readFile(copyFromPath)).toString();
            const copyToContents = (await readFile(copyToPath)).toString();
            const writeContents = inputs.configFileDefinition.updateCallback(
                copyFromContents,
                copyToContents,
            );
            await writeFile(copyToPath, writeContents);
        } else {
            await copyFile(copyFromPath, copyToPath);
        }
    }

    return {
        copiedToPath: copyToPath,
        didWrite: shouldWrite,
    };
}
