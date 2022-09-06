import {awaitedForEach, extractErrorMessage, Writeable} from 'augment-vir';
import {existsSync} from 'fs';
import {mkdir, readFile, writeFile} from 'fs/promises';
import {basename, dirname} from 'path';
import {Color} from '../cli-color';
import {CommandLogging} from '../command/command-logging';
import {ConfigFileDefinition} from './config-file-definition';
import {getCopyToPath} from './config-paths';

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
    packageDir: string;
    operation: CopyConfigOperation;
};

export type CopyConfigOutputs = {
    copiedToPath: string;
    shouldWrite: boolean;
};

function checkIfShouldWrite({
    configFileDefinition,
    operation,
    copyToPath,
}: {
    configFileDefinition: ConfigFileDefinition;
    operation: CopyConfigOperation;
    copyToPath: string;
}): boolean {
    const fileExists = existsSync(copyToPath);

    switch (operation) {
        case CopyConfigOperation.Init: {
            return !fileExists;
        }
        case CopyConfigOperation.Overwrite: {
            return true;
        }
        case CopyConfigOperation.Update: {
            return fileExists && !!configFileDefinition.updateExistingConfigFileCallback;
        }
    }
}

export async function copyConfig(inputs: CopyConfigInputs): Promise<CopyConfigOutputs> {
    const copyFromPath = inputs.configFileDefinition.copyFromInternalPath;
    const copyToPath = getCopyToPath(inputs);
    const shouldWriteBasedOnOperation = checkIfShouldWrite({
        configFileDefinition: inputs.configFileDefinition,
        operation: inputs.operation,
        copyToPath,
    });

    const currentRepoFileContents = existsSync(copyToPath)
        ? (await readFile(copyToPath)).toString()
        : '';
    const virmatorFileContents = (await readFile(copyFromPath)).toString();
    const writeContents = inputs.configFileDefinition.updateExistingConfigFileCallback
        ? await inputs.configFileDefinition.updateExistingConfigFileCallback(
              virmatorFileContents,
              currentRepoFileContents,
              inputs.repoDir,
          )
        : virmatorFileContents;

    const shouldWrite = shouldWriteBasedOnOperation && currentRepoFileContents !== writeContents;

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
    logging: CommandLogging;
    configFiles: ReadonlyArray<ConfigFileDefinition>;
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
    await awaitedForEach(
        (inputs.configFiles as Writeable<typeof inputs.configFiles>).sort((a, b) => {
            const aName = basename(a.copyToPathRelativeToRepoDir || a.copyFromInternalPath);
            const bName = basename(b.copyToPathRelativeToRepoDir || b.copyFromInternalPath);
            return aName.localeCompare(bName);
        }),
        async (configFile) => {
            try {
                const result = await copyConfig({
                    configFileDefinition: configFile,
                    operation: inputs.operation,
                    repoDir: inputs.repoDir,
                    packageDir: inputs.packageDir,
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
                    } ${basename(
                        configFile.copyToPathRelativeToRepoDir || configFile.copyFromInternalPath,
                    )}: ${extractErrorMessage(error)}`,
                );
                errors.push(copyError);
            }
        },
    );

    errors.forEach((error) => {
        inputs.logging.stderr(error.message);
    });

    return !errors.length;
}
