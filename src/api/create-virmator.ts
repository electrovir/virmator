import {ArrayElement, extractErrorMessage} from 'augment-vir';
import {CommandDefinitionArrayToMapping, commandsToMapping} from './command/command-mapping';
import {generateHelpMessage, HelpMessageSyntax} from './command/command-to-help-message';
import {CommandDefinition} from './command/define-command';
import {runExtendedVirmator} from './run-command/run-extended-virmator';
import {ExtendedVirmator, ExtendVirmatorInputs} from './virmator-types';

/**
 * Creates a wrapped instance of virmator from which all its CLI commands can be called. Arguments
 * can be passed in to add to virmator default configs or overwrite them.
 */
export function createVirmator<
    CommandDefinitionsGeneric extends ReadonlyArray<CommandDefinition<any>>,
>(
    inputs: ExtendVirmatorInputs<CommandDefinitionsGeneric>,
): ExtendedVirmator<CommandDefinitionArrayToMapping<CommandDefinitionsGeneric>> {
    const commandDefinitions = inputs.commandDefinitions ?? [];
    const commandMapping = commandsToMapping(commandDefinitions);

    const allCommands: CommandDefinitionArrayToMapping<CommandDefinitionsGeneric> = {
        ...{}, // todo: put the default commands here
        ...commandMapping,
    } as CommandDefinitionArrayToMapping<CommandDefinitionsGeneric>;

    const cliHelpMessage = generateHelpMessage(
        inputs.packageBinName,
        allCommands ?? {},
        HelpMessageSyntax.Cli,
    );
    const markdownHelpMessage = generateHelpMessage(
        inputs.packageBinName,
        allCommands,
        HelpMessageSyntax.Markdown,
    );

    async function run(allArgs: string[], repoDir: string) {
        return await runExtendedVirmator({
            allArgs,
            repoDir,
            packageBinName: inputs.packageBinName,
            packageDir: inputs.packageRootDir,
            commandMapping: allCommands,
        });
    }

    async function runInCli() {
        try {
            await run(process.argv, process.cwd());
        } catch (error) {
            console.error(extractErrorMessage(error));
            process.exit(1);
        }
    }

    function extendVirmator<NewGeneric extends ReadonlyArray<CommandDefinition>>(
        innerInputs: ExtendVirmatorInputs<NewGeneric>,
    ): ExtendedVirmator<
        CommandDefinitionArrayToMapping<NewGeneric> &
            CommandDefinitionArrayToMapping<CommandDefinitionsGeneric>
    > {
        type CombinedDefinitionsArray = ReadonlyArray<
            ArrayElement<NewGeneric | CommandDefinitionsGeneric>
        >;

        const allCommandDefinitions = [
            ...commandDefinitions,
            ...(innerInputs.commandDefinitions ?? []),
        ] as CombinedDefinitionsArray;

        return createVirmator<CombinedDefinitionsArray>({
            ...innerInputs,
            commandDefinitions: allCommandDefinitions,
        });
    }

    return {
        cliHelpMessage,
        extend: extendVirmator,
        markdownHelpMessage,
        commandMapping: allCommands,
        runInCli,
        run,
    };
}
