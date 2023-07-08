import {ConfigFileDefinition} from '../config/config-file-definition';

export enum NpmDepTypeEnum {
    Regular = 'regular',
    Dev = 'dev',
}

export type NpmDep = {name: string; type: NpmDepTypeEnum};

export type DefineCommandInputs<CommandName extends string = string> = Readonly<{
    commandName: CommandName;
    subCommandDescriptions: Readonly<Record<string, string>> | Readonly<{}>;
    configFiles: Readonly<Record<string, Readonly<ConfigFileDefinition>>> | Readonly<{}>;
    npmDeps: ReadonlyArray<NpmDep>;
}>;

export type SharedExecutorInputsAndCommandDefinition<
    DefineCommandInputsGeneric extends DefineCommandInputs,
> = DefineCommandInputsGeneric & {
    allAvailableSubCommands: ReadonlyArray<
        keyof DefineCommandInputsGeneric['subCommandDescriptions'] extends string
            ? keyof DefineCommandInputsGeneric['subCommandDescriptions']
            : never
    >;
    subCommands: SubCommandsMap<DefineCommandInputsGeneric>;
};

export type SubCommandsMap<DefineCommandInputsGeneric extends DefineCommandInputs> = {
    [Prop in keyof DefineCommandInputsGeneric['subCommandDescriptions']]: Prop extends string
        ? Prop
        : never;
};
