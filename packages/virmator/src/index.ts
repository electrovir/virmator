import {virmatorCompilePlugin} from '@virmator/compile';
import {virmatorDepsPlugin} from '@virmator/deps';
import {virmatorDocsPlugin} from '@virmator/docs';
import {virmatorFormatPlugin} from '@virmator/format';
import {virmatorFrontendPlugin} from '@virmator/frontend';
import {virmatorInitPlugin} from '@virmator/init';
import {virmatorPublishPlugin} from '@virmator/publish';
import {virmatorSpellcheckPlugin} from '@virmator/spellcheck';
import {virmatorTestPlugin} from '@virmator/test';

/** Default list of plugins that the virmator npm package's CLI uses. */
export const defaultVirmatorPlugins = [
    virmatorCompilePlugin,
    virmatorDepsPlugin,
    virmatorDocsPlugin,
    virmatorFormatPlugin,
    virmatorFrontendPlugin,
    virmatorInitPlugin,
    virmatorPublishPlugin,
    virmatorSpellcheckPlugin,
    virmatorTestPlugin,
];
