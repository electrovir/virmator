import {CommandDescription} from './command-help';
import {DefineCommandInputs, SubCommandsMap} from './define-command-inputs';

export type CreateDescriptionsInputs<DefineCommandInputsGeneric extends DefineCommandInputs> = Pick<
    DefineCommandInputsGeneric,
    'commandName'
> & {
    packageBinName: string;
    subCommands: SubCommandsMap<DefineCommandInputsGeneric>;
};

export type CreateDescriptionsCallback<DefineCommandInputsGeneric extends DefineCommandInputs> = (
    inputs: CreateDescriptionsInputs<DefineCommandInputsGeneric>,
) => CommandDescription;
