import {createVirmator} from './api/create-virmator';
import {codeInMarkdownCommandDefinition} from './commands/code-in-markdown.command';
import {compileCommandDefinition} from './commands/compile.command';
import {formatCommandDefinition} from './commands/format.command';
import {frontendCommandDefinition} from './commands/frontend.command';
import {initCommandDefinition} from './commands/init.command';
import {publishCommandDefinition} from './commands/publish.command';
import {spellcheckCommandDefinition} from './commands/spellcheck.command';
import {testWebCommandDefinition} from './commands/test-web.command';
import {testCommandDefinition} from './commands/test.command';
import {updateConfigsCommandDefinition} from './commands/update-configs.command';
import {virmatorPackageDir} from './file-paths/package-paths';
export * from './api/command/command-description';
export * from './api/command/command-executor';
export * from './api/command/command-help';
export * from './api/command/command-logging';
export * from './api/command/command-mapping';
export * from './api/command/command-messages';
export * from './api/command/command-to-help-message';
export * from './api/command/define-command';
export * from './api/command/define-command-inputs';
export * from './api/config/config-file-definition';
export * from './api/config/config-paths';
export * from './api/create-virmator';
export * from './api/virmator-types';
export * from './commands/extra-configs/combine-text-config';

export const virmator = createVirmator({
    packageBinName: 'virmator',
    packageRootDir: virmatorPackageDir,
    commandDefinitions: [
        codeInMarkdownCommandDefinition,
        compileCommandDefinition,
        formatCommandDefinition,
        frontendCommandDefinition,
        initCommandDefinition,
        publishCommandDefinition,
        spellcheckCommandDefinition,
        testCommandDefinition,
        testWebCommandDefinition,
        updateConfigsCommandDefinition,
    ],
});
