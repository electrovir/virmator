import {CommandMapping} from './command/command-mapping';
import {CommandDefinition} from './command/define-command';
import {createVirmator} from './create-virmator';

export type ExtendVirmatorInputs<
    CommandDefinitionsGeneric extends ReadonlyArray<CommandDefinition>,
> = Readonly<{
    packageBinName: string;
    packageRootDir: string;
    commandDefinitions?: CommandDefinitionsGeneric;
}>;

export type ExtendedVirmator<CommandMappingGeneric extends Readonly<CommandMapping>> = Readonly<{
    cliHelpMessage: string;
    markdownHelpMessage: string;
    commandMapping: CommandMappingGeneric;
    extend: typeof createVirmator;
    runInCli: () => Promise<void>;
    run: (allArgs: string[], repoDir: string) => Promise<void>;
}>;
