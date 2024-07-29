import {virmatorCompilePlugin} from '@virmator/compile';
import {virmatorDepsPlugin} from '@virmator/deps';
import {virmatorDocsPlugin} from '@virmator/docs';
import {virmatorFormatPlugin} from '@virmator/format';
import {virmatorFrontendPlugin} from '@virmator/frontend';
import {virmatorSpellcheckPlugin} from '@virmator/spellcheck';

export const defaultVirmatorPlugins = [
    virmatorCompilePlugin,
    virmatorDepsPlugin,
    virmatorDocsPlugin,
    virmatorFormatPlugin,
    virmatorFrontendPlugin,
    virmatorSpellcheckPlugin,
];
