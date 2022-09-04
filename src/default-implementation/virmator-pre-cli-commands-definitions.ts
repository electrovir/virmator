import {wrapVirmatorBeforeCommandDefinitions} from '../api/wrap-virmator-before-command-definitions';
import {virmatorConfigsDir} from '../file-paths/virmator-package-paths';
import {configFiles} from './configs/virmator-config-files';
import {cliFlagDefinitions} from './default-cli-flags';

export const virmatorPreCommandDefinitions = wrapVirmatorBeforeCommandDefinitions({
    packageCliName: 'virmator',
    configFiles,
    newConfigFilesDir: virmatorConfigsDir,
    cliFlags: cliFlagDefinitions,
});
