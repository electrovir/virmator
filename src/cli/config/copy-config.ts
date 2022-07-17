import {awaitedForEach, extractErrorMessage} from 'augment-vir';
import {existsSync} from 'fs';
import {mkdir, readFile, writeFile} from 'fs/promises';
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

    const currentRepoFileContents = existsSync(copyToPath)
        ? (await readFile(copyToPath)).toString()
        : '';
    const virmatorFileContents = (await readFile(copyFromPath)).toString();
    const writeContents = inputs.configFileDefinition.updateCallback
        ? await inputs.configFileDefinition.updateCallback(
              virmatorFileContents,
              currentRepoFileContents,
              inputs.repoDir,
          )
        : virmatorFileContents;

    if (currentRepoFileContents === writeContents) {
        shouldWrite = false;
    }

    if (shouldWrite) {
        await mkdir(dirname(copyToPath), {recursive: true});

        await writeFile(copyToPath, writeContents);
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

const successfulOperation: Readonly<Record<CopyConfigOperation, string>> = {
    [CopyConfigOperation.Init]: 'copied',
    [CopyConfigOperation.Overwrite]: 'overwrote',
    [CopyConfigOperation.Update]: 'updated',
} as const;
const failedOperation: Readonly<Record<CopyConfigOperation, string>> = {
    [CopyConfigOperation.Init]: 'copy',
    [CopyConfigOperation.Overwrite]: 'overwrite',
    [CopyConfigOperation.Update]: 'update',
} as const;

/** Returns success state. True if success, false is errors were encountered. */
export async function copyAllConfigFiles(inputs: CopyAllConfigFilesInputs): Promise<boolean> {
    const errors: Error[] = [];
    await awaitedForEach(Object.keys(inputs.configFiles).sort(), async (configKey) => {
        const configFile = inputs.configFiles[configKey]!;
        try {
            const result = await copyConfig({
                configFileDefinition: configFile,
                operation: inputs.operation,
                repoDir: inputs.repoDir,
            });
            if (result.shouldWrite) {
                inputs.logging.stdout(
                    `${Color.Info}Successfully ${successfulOperation[inputs.operation]}${
                        Color.Reset
                    } ${basename(result.copiedToPath)}`,
                );
            }
        } catch (error) {
            const copyError = new Error(
                `${Color.Fail}Failed to ${failedOperation[inputs.operation]}${
                    Color.Reset
                } ${basename(configFile.path)}: ${extractErrorMessage(error)}`,
            );
            errors.push(copyError);
        }
    });

    errors.forEach((error) => {
        inputs.logging.stderr(error.message);
    });

    return !errors.length;
}
