import {isEnumValue} from '../../augments/object';
import {DeepWriteable} from '../../augments/type';
import {runBashCommand} from '../../bash-scripting';
import {CliFlagName, defaultCliFlags} from '../cli-util/cli-flags';
import {ConfigFile} from '../config/configs';
import {
    CliCommand,
    CliCommandImplementation,
    CliCommandResult,
    CommandFunctionInput,
} from './cli-command';

export enum FormatOperation {
    Check = 'check',
    Write = 'write',
}

type FormatArgs = Required<
    Readonly<{
        operation: FormatOperation;
        fileExtensions: Readonly<string[]>;
    }>
>;

export const defaultFormatArgs: FormatArgs = {
    operation: FormatOperation.Write,
    fileExtensions: ['ts', 'json', 'html', 'css', 'md', 'js', 'yml', 'yaml'],
} as const;

export const formatImplementation: CliCommandImplementation = {
    description: `formats source files with Prettier
            sub commands:
                ${
                    FormatOperation.Write
                }: overwrites files to fix formatting. This is the default operation.
                ${FormatOperation.Check}: checks the formatting, does not write to files
                Any other arguments are treated as a list of file extensions to format.
                    The default list of file extensions is the following:
                        ${defaultFormatArgs.fileExtensions.join(', ')}
                    For example, the following command will overwrite files
                    (because ${
                        FormatOperation.Write
                    } is the default operation) only if they have the 
                    extension ".md" or ".json":
                        virmator ${CliCommand.Format} md json
            
            examples:
                checks formatting for files
                    virmator ${CliCommand.Format} ${FormatOperation.Check}
                checks formatting only for .md files
                    virmator ${CliCommand.Format} ${FormatOperation.Check} md
                checks formatting only for .md and .json files
                    virmator ${CliCommand.Format} ${FormatOperation.Check} md json
                fixes formatting for files
                    virmator ${CliCommand.Format}
                    or
                    virmator ${CliCommand.Format} ${FormatOperation.Write}`,
    configFile: ConfigFile.Prettier,
    implementation: runFormatCommand,
};

export async function runFormatCommand({
    rawArgs = [],
    cliFlags = defaultCliFlags,
    customDir,
}: CommandFunctionInput): Promise<CliCommandResult> {
    const args = extractFormatArgs(rawArgs);

    const operationFlag = args.operation === FormatOperation.Check ? '--check' : '--write';

    const prettierCommand = `prettier --color --ignore-path .gitignore \"./**/*.+(${args.fileExtensions.join(
        '|',
    )})\" ${operationFlag}`;
    if (!cliFlags[CliFlagName.Silent]) {
        console.info('Running format...');
    }
    const results = await runBashCommand(prettierCommand, customDir);

    if (!cliFlags[CliFlagName.Silent]) {
        if (results.stdout) {
            console.error(results.stdout);
        }
        if (results.stderr) {
            console.error(results.stderr);
        }
    }

    if (results.error) {
        return {success: false};
    } else {
        return {success: true};
    }
}

export function extractFormatArgs(rawArgs: string[]): FormatArgs {
    const extractedArgs: Partial<DeepWriteable<FormatArgs>> = rawArgs.reduce(
        (accum, currentRawArg) => {
            if (isEnumValue(currentRawArg, FormatOperation)) {
                accum.operation = currentRawArg;
            } else if (currentRawArg.startsWith('--')) {
                // flag args should not be passed into format command
            } else {
                if (!accum.fileExtensions) {
                    accum.fileExtensions = [];
                }
                accum.fileExtensions.push(currentRawArg);
            }
            return accum;
        },
        {} as Partial<DeepWriteable<FormatArgs>>,
    );

    const finalArgs: FormatArgs = {
        ...defaultFormatArgs,
        ...extractedArgs,
    };

    return finalArgs;
}
