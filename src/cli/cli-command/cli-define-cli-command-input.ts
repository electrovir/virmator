import {CommandConfigKey} from '../config/config-key';
import {CliCommandDescription} from './cli-command-help';
import {CliCommandName} from './cli-command-name';

export type DefineCliCommandInputs = Readonly<{
    commandName: CliCommandName;
    supportedConfigKeys: Readonly<CommandConfigKey[]>;
    subCommandDescriptions: Readonly<Record<string, string>>;
    commandDescription: CliCommandDescription;
}>;
