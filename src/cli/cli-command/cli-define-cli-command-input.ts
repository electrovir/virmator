import {CommandConfigKey} from '../config/config-key';
import {CliHelpDescription} from './cli-command-help';
import {CliCommandName} from './cli-command-name';

export type DefineCliCommandInputs = Readonly<{
    commandName: CliCommandName;
    supportedConfigKeys: Readonly<CommandConfigKey[]>;
    subCommandDescriptions: Readonly<Record<string, string>>;
    commandDescription: CliHelpDescription;
}>;
