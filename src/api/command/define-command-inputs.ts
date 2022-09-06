import {ConfigFileDefinition} from '../config/config-file-definition';

export type DefineCommandInputs<CommandName extends string = string> = Readonly<{
    commandName: CommandName;
    subCommandDescriptions: Readonly<Record<string, string>>;
    configFiles: Readonly<Record<string, Readonly<ConfigFileDefinition>>>;
    npmDeps: ReadonlyArray<string>;
}>;

export type SharedExecutorInputsAndCommandDefinition<
    DefineCommandInputsGeneric extends DefineCommandInputs,
> = DefineCommandInputsGeneric & {
    allAvailableSubCommands: (keyof DefineCommandInputsGeneric['subCommandDescriptions'])[];
    subCommands: SubCommandsMap<DefineCommandInputsGeneric>;
};

export type SubCommandsMap<DefineCommandInputsGeneric extends DefineCommandInputs> = {
    [Prop in keyof DefineCommandInputsGeneric['subCommandDescriptions']]: Prop;
};
