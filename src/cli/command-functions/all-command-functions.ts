import {CliCommand, CommandFunction} from '../cli-command';
import {runFormatCommand} from './format/format';

const unImplementedCommandFunction: CommandFunction = () => {
    throw new Error('This command has not been implemented yet.');
};

export const cliCommands: Record<CliCommand, CommandFunction> = {
    [CliCommand.Format]: runFormatCommand,
    [CliCommand.SpellCheck]: unImplementedCommandFunction,
    [CliCommand.Test]: unImplementedCommandFunction,
    [CliCommand.Help]: unImplementedCommandFunction,
    [CliCommand.UpdateConfigs]: unImplementedCommandFunction,
};
