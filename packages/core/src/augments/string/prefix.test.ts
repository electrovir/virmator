import {itCases} from '@augment-vir/testing';
import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {findLongestCommonPrefix} from './prefix';

describe(findLongestCommonPrefix.name, () => {
    itCases(
        {
            assert,
            excludeIt: it.skip,
            forceIt: it.only,
            it,
        },
        findLongestCommonPrefix,
        [
            {
                it: 'finds common prefix amongst a few words',
                input: [
                    'foo',
                    'food',
                    'foobar',
                    'football',
                ],
                expect: 'foo',
            },
            {
                it: 'finds common prefix amongst package paths',
                input: [
                    'packages/common',
                    'packages/testing',
                    'packages/browser-testing',
                    'packages/chai',
                    'packages/browser',
                    'packages/element-vir',
                    'packages/node-js',
                    'packages/common-tests',
                    'packages/docker',
                    'packages/prisma-node-js',
                    'packages/scripts',
                ],
                expect: 'packages/',
            },
            {
                it: 'returns empty string when no common prefixes exist',
                input: [
                    'foo',
                    'food',
                    'grape',
                    'foobar',
                    'football',
                ],
                expect: '',
            },
        ],
    );
});
