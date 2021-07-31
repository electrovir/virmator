import {isEnumValue} from '../../../augments/object';
import {DeepWriteable} from '../../../augments/type';
import {runBashCommand} from '../../../bash-scripting';
import {CliCommandResult, CommandFunction} from '../../cli-command';
import {CliFlags, defaultCliFlags} from '../../flags';

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
    fileExtensions: ['ts', 'json', 'html', 'css', 'md'],
} as const;

export const runFormatCommand: CommandFunction = async (
    rawArgs: string[] = [],
    cliFlags: CliFlags = defaultCliFlags,
    customDir?: string,
): Promise<CliCommandResult> => {
    const args = extractFormatArgs(rawArgs);

    const operationFlag = args.operation === FormatOperation.Check ? '--check' : '--write';

    const prettierCommand = `prettier --color --ignore-path .gitignore \"./**/*.+(${args.fileExtensions.join(
        '|',
    )})\" ${operationFlag}`;
    if (!cliFlags.silent) {
        console.info('Running format...');
    }
    const results = await runBashCommand(prettierCommand, customDir);

    if (!cliFlags.silent) {
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
};

export function extractFormatArgs(rawArgs: string[]): FormatArgs {
    const extractedArgs: Partial<DeepWriteable<FormatArgs>> = rawArgs.reduce(
        (accum, currentRawArg) => {
            if (isEnumValue(currentRawArg, FormatOperation)) {
                accum.operation = currentRawArg;
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
