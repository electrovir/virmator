export type DefineCommandInputs<CommandName extends string = string> = Readonly<{
    commandName: CommandName;
    subCommandDescriptions: Readonly<Record<string, string>>;
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
