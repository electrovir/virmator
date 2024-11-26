import {describe, snapshotCases} from '@augment-vir/test';
import {createOutputText} from './snapshot-store.js';

describe(createOutputText.name, () => {
    snapshotCases(createOutputText, [
        {
            it: 'handles string values',
            input: {
                'thing > test': 'hello there',
                'thing > test 2': 'hello there 2',
            },
        },
        {
            it: 'handles object values',
            input: {
                'thing > test': {
                    nested: {
                        object: true,
                    },
                },
            },
        },
    ]);
});
