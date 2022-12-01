import {getObjectTypedValues} from '@augment-vir/common';
import {ConfigFileDefinition} from '../config/config-file-definition';
import {CommandMapping} from './command-mapping';

export function extractAllConfigs(
    commandMapping: CommandMapping,
): ReadonlyArray<ConfigFileDefinition> {
    const configFiles = getObjectTypedValues(commandMapping)
        .map((commandDefinition) => getObjectTypedValues(commandDefinition.configFiles))
        .flat();

    return configFiles;
}
