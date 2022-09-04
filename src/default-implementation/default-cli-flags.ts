import {CliFlagDefinition} from '../api/cli-flags';

export enum DefaultCliFlagName {
    Help = '--help',
    Silent = '--silent',
}

export const cliFlagDefinitions: Readonly<Record<DefaultCliFlagName, CliFlagDefinition>> = {
    [DefaultCliFlagName.Silent]: {
        description: 'Turns off most logging.',
    },
    [DefaultCliFlagName.Help]: {
        description: 'Prints this help message.',
    },
};
