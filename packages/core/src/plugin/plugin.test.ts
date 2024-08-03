import {describe, it} from 'node:test';
import {defineVirmatorPlugin} from './plugin';

describe(defineVirmatorPlugin.name, () => {
    it('defines a plugin', () => {
        defineVirmatorPlugin(
            import.meta.dirname,
            {
                name: 'test plugin',
                cliCommands: {
                    example: {
                        doc: {
                            examples: [],
                            sections: [],
                        },
                    },
                },
            },
            async () => {},
        );
    });
});
