import {CliCommandName} from '../cli-shared/cli-command-name';
import {CommandConfigKey} from '../config/config-key';
import {CommandFunctionInput} from './cli-command-inputs';

export type CliCommandResult = {
    command: string | undefined;
    success: boolean;
};

export type CliHelpSection = Readonly<{
    title: string;
    content: string;
}>;
export type CliHelpDescription = Readonly<{
    sections: CliHelpSection[];
    examples: CliHelpSection[];
}>;

export type CliSubCommandDescriptions = Readonly<Record<string, string>>;
export type AllowedSubCommands<DescriptionsGeneric extends CliSubCommandDescriptions> =
    keyof DescriptionsGeneric;

export type CliCommandImplementation = Readonly<{
    commandName: CliCommandName;
    configKeys?: Readonly<[CommandConfigKey, ...CommandConfigKey[]]> | undefined;
    description: CliHelpDescription;
    implementation: CommandFunction;
    subCommands?: Readonly<[CliSubCommand, ...CliSubCommand[]]> | undefined;
}>;

export type CommandFunction<SubCommandDescriptions extends CliSubCommandDescriptions> = (
    input: CommandFunctionInput,
) => CliCommandResult | Promise<CliCommandResult>;
