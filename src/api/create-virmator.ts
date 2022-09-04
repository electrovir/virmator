import {extractErrorMessage} from 'augment-vir';
import {CommandMapping, commandsToMapping} from './command/command-mapping';
import {generateHelpMessage, HelpMessageSyntax} from './command/command-to-help-message';
import {CommandDefinition} from './command/define-command';
import {runExtendedVirmator} from './run-command/run-extended-virmator';

export type ExtendVirmatorInputs = Readonly<{
    packageBinName: string;
    commandDefinitions?: ReadonlyArray<CommandDefinition> | undefined;
}>;

export type ExtendedVirmator = Readonly<{
    cliHelpMessage: string;
    markdownHelpMessage: string;
    commandMapping: Readonly<CommandMapping>;
    extend: typeof createVirmator;
    runInCli: () => Promise<void>;
    run: (allArgs: string[], repoDir: string) => Promise<void>;
}>;

/**
 * Creates a wrapped instance of virmator from which all its CLI commands can be called. Arguments
 * can be passed in to add to virmator default configs or overwrite them.
 */
export function createVirmator(inputs: ExtendVirmatorInputs): ExtendedVirmator {
    const commandDefinitions = inputs.commandDefinitions ?? [];
    const commandMapping = commandsToMapping(commandDefinitions);

    const allCommands: CommandMapping = {
        ...{}, // todo: put the default commands here
        ...commandMapping,
    };

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
        return await runExtendedVirmator(allArgs, repoDir, inputs.packageBinName, allCommands);
    }

    async function runInCli() {
        try {
            await run(process.argv, process.cwd());
        } catch (error) {
            console.error(extractErrorMessage(error));
            process.exit(1);
        }
    }

    function extendVirmator(innerInputs: ExtendVirmatorInputs): ExtendedVirmator {
        const allCommandDefinitions = [
            ...commandDefinitions,
            ...(innerInputs.commandDefinitions ?? []),
        ];

        return createVirmator({
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
