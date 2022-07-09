import {awaitedForEach, extractErrorMessage} from 'augment-vir';
import {existsSync} from 'fs';
import {copyFile, mkdir, readFile, writeFile} from 'fs/promises';
import {basename, dirname} from 'path';
import {CliLogging} from '../../logging';
import {Color} from '../cli-color';
import {ConfigFileDefinition, doesCopyToConfigPathExist, getCopyToPath} from './config-files';

export enum CopyConfigOperation {
    /** Only update the config file if it exists and is marked as being able to be updated. */
    Update = 'update',
    /** Overwrite config file, even if it already exists in the repo. */
    Overwrite = 'overwrite',
    /** Only write the config file if it doesn't exist already or if it can be updated. */
    Init = 'init',
}

export type CopyConfigInputs = {
    configFileDefinition: ConfigFileDefinition;
    repoDir: string;
    operation: CopyConfigOperation;
};

export type CopyConfigOutputs = {
    copiedToPath: string;
    shouldWrite: boolean;
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
                (inputs.configFileDefinition.canBeUpdated ||
                    inputs.configFileDefinition.updateCallback)
            ) {
                shouldWrite = true;
            }
            break;
        }
    }

    if (shouldWrite) {
        await mkdir(dirname(copyToPath), {recursive: true});

        if (
            inputs.operation === CopyConfigOperation.Update &&
            typeof inputs.configFileDefinition !== 'string' &&
            inputs.configFileDefinition.updateCallback !== undefined
        ) {
            const copyFromContents = (await readFile(copyFromPath)).toString();
            const copyToContents = existsSync(copyToPath)
                ? (await readFile(copyToPath)).toString()
                : '';
            const writeContents = await inputs.configFileDefinition.updateCallback(
                copyFromContents,
                copyToContents,
                inputs.repoDir,
            );
            await writeFile(copyToPath, writeContents);
        } else {
            await copyFile(copyFromPath, copyToPath);
        }
    }

    return {
        copiedToPath: copyToPath,
        shouldWrite,
    };
}

export type CopyAllConfigFilesInputs = Omit<CopyConfigInputs, 'configFileDefinition'> & {
    logging: CliLogging;
    configFiles: Record<string, ConfigFileDefinition>;
};

/** Returns success state. True if success, false is errors were encountered. */
export async function copyAllConfigFiles(inputs: CopyAllConfigFilesInputs): Promise<boolean> {
    const errors: Error[] = [];
    await awaitedForEach(Object.values(inputs.configFiles), async (configFile) => {
        try {
            const result = await copyConfig({
                configFileDefinition: configFile,
                operation: inputs.operation,
                repoDir: inputs.repoDir,
            });
            if (result.shouldWrite) {
                inputs.logging.stdout(
                    `${Color.Info}Successfully copied${Color.Reset} ${basename(configFile.path)}.`,
                );
            }
        } catch (error) {
            const copyError = new Error(
                `${Color.Fail}Failed to copy${Color.Reset} ${basename(
                    configFile.path,
                )}: ${extractErrorMessage(error)}`,
            );
            errors.push(copyError);
        }
    });

    errors.forEach((error) => {
        inputs.logging.stderr(error.message);
    });

    return !errors.length;
}
