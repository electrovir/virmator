import {virmatorCompilePlugin} from '@virmator/compile';
import {virmatorDepsPlugin} from '@virmator/deps';
import {virmatorDocsPlugin} from '@virmator/docs';
import {virmatorSpellcheckPlugin} from '@virmator/spellcheck';

export const defaultVirmatorPlugins = [
    virmatorCompilePlugin,
    virmatorSpellcheckPlugin,
    virmatorDepsPlugin,
    virmatorDocsPlugin,
];
