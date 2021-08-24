import {isEnumValue} from '../../../augments/object';
import {DeepWriteable} from '../../../augments/type';
import {runBashCommand} from '../../../bash-scripting';
import {packageName} from '../../../package-name';
import {CliFlagName} from '../../cli-util/cli-flags';
import {ConfigKey} from '../../config/configs';
import {
    CliCommand,
    CliCommandImplementation,
    CliCommandResult,
    CommandFunctionInput,
} from '../cli-command';

export enum FormatOperation {
    Check = 'check',
    Write = 'write',
}

type FormatArgs = Required<
    Readonly<{
        operation: FormatOperation;
        fileExtensions: Readonly<string[]>;
        prettierFlags: Readonly<string[]>;
    }>
>;

export const defaultFormatArgs: FormatArgs = {
    operation: FormatOperation.Write,
    prettierFlags: ['--ignore-path', '.gitignore'],
    fileExtensions: ['ts', 'json', 'html', 'css', 'md', 'js', 'yml', 'yaml'],
} as const;

export const filesMarkerArg = '--format-files' as const;

export const formatImplementation: CliCommandImplementation = {
    commandName: CliCommand.Format,
    description: `formats source files with Prettier
            operation commands:
                This is optional but if provided it must come first. ${FormatOperation.Write} is the default.
                
                ${FormatOperation.Write}: overwrites files to fix formatting.
                ${FormatOperation.Check}: checks the formatting, does not write to files
            
            file extensions:
                If only specific file extensions should be formatted, add the "${filesMarkerArg}"
                argument to this command. All following arguments will be treated
                as file extensions to be formatted.
                For example, the following command will overwrite files
                (because ${FormatOperation.Write} is the default operation) only if they have the 
                extension ".md" or ".json":
                    ${packageName} ${CliCommand.Format} ${filesMarkerArg} md json
                
            Prettier flags:
                Any other arguments encountered between the operation command (if provided)
                and the "${filesMarkerArg}" marker are treated as extra arguments to Prettier and
                will be passed along.
                This defaults to just '--ignore-path .gitignore'. (Thus, by default, this command
                will only format non-git-ignored files.)
            
            examples:
                checks formatting for files:
                    ${packageName} ${CliCommand.Format} ${FormatOperation.Check}
                checks formatting only for .md files:
                    ${packageName} ${CliCommand.Format} ${FormatOperation.Check} ${filesMarkerArg} md
                checks formatting only for .md and .json files:
                    ${packageName} ${CliCommand.Format} ${FormatOperation.Check} ${filesMarkerArg} md json
                fixes formatting for files:
                    ${packageName} ${CliCommand.Format}
                    or
                    ${packageName} ${CliCommand.Format} ${FormatOperation.Write}
                examples with extra Prettier flags:
                    ${packageName} ${CliCommand.Format} --ignore-path .prettierignore
                    ${packageName} ${CliCommand.Format} ${FormatOperation.Write}  --ignore-path .prettierignore
                    ${packageName} ${CliCommand.Format} ${FormatOperation.Write}  --ignore-path .prettierignore ${filesMarkerArg} md json`,
    configKeys: [ConfigKey.Prettier],
    implementation: runFormatCommand,
    configFlagSupport: {
        [CliFlagName.NoWriteConfig]: true,
    },
};

export async function runFormatCommand({
    rawArgs,
    cliFlags,
    customDir,
}: CommandFunctionInput): Promise<CliCommandResult> {
    const args = extractFormatArgs(rawArgs);

    const operationFlag = args.operation === FormatOperation.Check ? '--check' : '--write';

    const prettierCommand = `prettier --color ${args.prettierFlags.join(
        ' ',
    )} \"./**/*.+(${args.fileExtensions.join('|')})\" ${operationFlag}`;

    const results = await runBashCommand(prettierCommand, customDir);

    return {
        success: !results.error,
        stdout: results.stdout.replace('Checking formatting...\n', ''),
        stderr: results.stderr,
        error: results.error,
    };
}

export function extractFormatArgs(rawArgs: string[]): FormatArgs {
    let addingFileExtensions = false;
    const operation: FormatOperation = isEnumValue(rawArgs[0], FormatOperation)
        ? rawArgs[0]
        : FormatOperation.Write;
    const extractedArgs: Partial<DeepWriteable<FormatArgs>> = rawArgs.reduce(
        (accum, currentRawArg, index) => {
            if (index === 0 && isEnumValue(rawArgs[index], FormatOperation)) {
                return accum;
            } else if (currentRawArg === filesMarkerArg) {
                addingFileExtensions = true;
            } else if (addingFileExtensions) {
                if (!accum.fileExtensions) {
                    accum.fileExtensions = [];
                }
                accum.fileExtensions.push(currentRawArg);
            } else {
                if (!accum.prettierFlags) {
                    accum.prettierFlags = [];
                }
                accum.prettierFlags.push(currentRawArg);
            }

            return accum;
        },
        {prettierFlags: [...defaultFormatArgs.prettierFlags]} as Partial<DeepWriteable<FormatArgs>>,
    );

    const finalArgs: FormatArgs = {
        ...defaultFormatArgs,
        ...extractedArgs,
        operation,
    };

    return finalArgs;
}
