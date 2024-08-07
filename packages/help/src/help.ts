import {defineVirmatorPlugin} from '@virmator/core';
import {generateHelpMessageFromPlugins, HelpMessageSyntax} from './help-message.js';

/** A virmator plugin for printing help messages from other plugins. */
export const virmatorHelpPlugin = defineVirmatorPlugin(
    import.meta.dirname,
    {
        name: 'Help',
        cliCommands: {
            help: {
                doc: {
                    examples: [
                        {
                            content: 'virmator help',
                        },
                    ],
                    sections: [
                        'Prints help messages for all supported plugins/commands.',
                    ],
                },
            },
        },
    },
    ({virmator: {allPlugins}, log}) => {
        log.plain(generateHelpMessageFromPlugins(allPlugins, HelpMessageSyntax.Cli));
    },
);
