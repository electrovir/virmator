import {Overwrite} from 'augment-vir';
import {repoRootDir} from '../../file-paths/repo-paths';
import {CliFlags, fillInCliFlags} from '../cli-shared/cli-flags';

const defaultCommandFunctionInput: CommandFunctionInput = {
    filteredArgs: [],
    subCommands: [],
    cliFlags: fillInCliFlags(),
    repoDir: repoRootDir,
    stdoutCallback: () => {},
    stderrCallback: () => {},
} as const;

export type RawCommandFunctionInput<SubCommandGeneric extends string | undefined> = Overwrite<
    CommandFunctionInput<SubCommandGeneric>,
    {cliFlags: CommandFunctionInput<SubCommandGeneric>['cliFlags'] | Readonly<Partial<CliFlags>>}
>;

export function fillInCommandInput<SubCommandGeneric extends string | undefined>(
    commandInput?: Partial<RawCommandFunctionInput<SubCommandGeneric>>,
): CommandFunctionInput<SubCommandGeneric> {
    const cliFlags = fillInCliFlags(commandInput?.cliFlags);
    const emptyArray: CommandFunctionInput<SubCommandGeneric>['subCommands'] =
        [] as unknown[] as CommandFunctionInput<SubCommandGeneric>['subCommands'];
    const subCommands: CommandFunctionInput<SubCommandGeneric>['subCommands'] =
        commandInput?.subCommands ?? emptyArray;

    const mergedInputs: CommandFunctionInput<SubCommandGeneric> = {
        ...commandInput,
        ...defaultCommandFunctionInput,
        subCommands,
        cliFlags,
    };

    return mergedInputs;
}

export type LoggingCallback = (output: string) => void;

export type CommandFunctionInput<SubCommandGeneric extends string | undefined | void = void> =
    Readonly<{
        filteredArgs: Readonly<string[]>;
        cliFlags: Required<Readonly<CliFlags>>;
        subCommands: Readonly<
            SubCommandGeneric extends undefined | void ? [] : SubCommandGeneric[]
        >;
        repoDir: string;
        stdoutCallback: LoggingCallback;
        stderrCallback: LoggingCallback;
    }>;
