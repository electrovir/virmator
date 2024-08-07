import {log} from '@augment-vir/node-js';
import {existsSync} from 'node:fs';
import {dirname} from 'node:path';
import {
    findConfigFile,
    ParsedCommandLine,
    parseJsonConfigFileContent,
    readConfigFile,
    sys,
} from 'typescript';

/** Parsed the nearest ancestor TS Config file, if one can be found. */
export function parseTsConfig(cwd: string): ParsedCommandLine | undefined {
    try {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const tsConfigPath = findConfigFile(cwd, sys.fileExists);

        /** It'll be quite hard to setup a test where `tsConfigPath` is defined but does not exist. */
        /* node:coverage ignore next 1 */
        if (!tsConfigPath || !existsSync(tsConfigPath)) {
            return undefined;
        }

        // eslint-disable-next-line @typescript-eslint/unbound-method
        const configFile = readConfigFile(tsConfigPath, sys.readFile);
        return parseJsonConfigFileContent(configFile.config, sys, dirname(tsConfigPath));
        /* node:coverage ignore next 4 */
    } catch (error) {
        log.error(error);
        return undefined;
    }
}
