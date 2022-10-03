import {CommandDefinitionArrayToMapping, CommandMapping} from './command/command-mapping';
import {CommandDefinition} from './command/define-command';
import {ConfigFileDefinition} from './config/config-file-definition';

export type ExtendVirmatorInputs<
    CommandDefinitionsGeneric extends ReadonlyArray<CommandDefinition>,
> = Readonly<{
    packageBinName: string;
    packageRootDir: string;
    commandDefinitions?: CommandDefinitionsGeneric;
}>;

export type ExtendedVirmator<CommandMappingGeneric extends Readonly<CommandMapping>> = Readonly<{
    packageBinName: string;
    cliHelpMessage: string;
    markdownHelpMessage: string;
    commandMapping: CommandMappingGeneric;
    extend: <CommandDefinitionsGeneric extends ReadonlyArray<CommandDefinition<any>>>(
        inputs: ExtendVirmatorInputs<CommandDefinitionsGeneric>,
    ) => ExtendedVirmator<CommandDefinitionArrayToMapping<CommandDefinitionsGeneric>>;
    allConfigs: ReadonlyArray<ConfigFileDefinition>;
    runInCli: () => Promise<void>;
    run: (allArgs: string[], repoDir: string) => Promise<void>;
}>;
