import {CliCommandName} from '../cli-shared/cli-command-name';
import {CommandConfigKey} from '../config/config-key';
import {CliHelpDescription} from './cli-command-help';

export type DefineCliCommandInputs<
    SubCommandDescriptionsGeneric extends Readonly<Record<string, string>> = Readonly<
        Record<string, string>
    >,
> = Readonly<{
    commandName: CliCommandName;
    supportedConfigKeys: Readonly<CommandConfigKey[]>;
    subCommandDescriptions: SubCommandDescriptionsGeneric;
    commandDescription: CliHelpDescription;
}>;
