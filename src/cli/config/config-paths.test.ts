import {getEnumTypedValues} from 'augment-vir/dist/node-index';
import {existsSync} from 'fs';
import {ConfigKey} from './config-key';
import {getVirmatorConfigFilePath} from './config-paths';

describe('config paths', () => {
    it('should not have any config files missing', () => {
        expect(
            getEnumTypedValues(ConfigKey).filter((configKey) => {
                return !existsSync(getVirmatorConfigFilePath(configKey, false));
            }),
        ).toEqual([]);
    });
});
