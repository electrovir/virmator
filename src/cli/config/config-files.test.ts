import {getObjectTypedKeys} from 'augment-vir';
import {assert} from 'chai';
import {existsSync} from 'fs';
import {describe, it} from 'mocha';
import {relativeToVirmatorRoot} from '../../file-paths/virmator-package-paths';
import {configFiles} from './config-files';

describe(relativeToVirmatorRoot(__filename), () => {
    it('should be able to find all virmator copies of config files', () => {
        getObjectTypedKeys(configFiles).forEach((configFileName) => {
            const configFileDefinition = configFiles[configFileName];
            const path = configFileDefinition.path;

            assert.isTrue(
                existsSync(path),
                `Could not find config file for "${configFileName}": ${path}`,
            );
        });
    });
});
