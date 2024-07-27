import {itCases} from '@augment-vir/testing';
import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {findLongestCommentPath} from './common-path';

describe(findLongestCommentPath.name, () => {
    itCases(
        {
            assert,
            excludeIt: it.skip,
            forceIt: it.only,
            it,
        },
        findLongestCommentPath,
        [
            {
                it: 'finds common path',
                input: [
                    '/a/b/c',
                    '/a/b/cat',
                ],
                expect: '/a/b',
            },
            {
                it: 'returns empty string if there is no common path',
                input: [
                    '/a/b/c',
                    '/a/b/cat',
                    'q/b/c/',
                ],
                expect: '',
            },
        ],
    );
});
