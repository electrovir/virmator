import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {VirmatorNoTraceError} from '@virmator/core';
import {assertValidLicense} from './publish.js';

describe(assertValidLicense.name, () => {
    it('accepts a simple SPDX identifier', () => {
        assertValidLicense({
            license: 'MIT',
            isPrivate: false,
            displayName: 'pkg',
        });
    });

    it('accepts a compound SPDX expression', () => {
        assertValidLicense({
            license: '(MIT OR CC0-1.0)',
            isPrivate: false,
            displayName: 'pkg',
        });
    });

    it('skips private packages even when the license is invalid', () => {
        assertValidLicense({
            license: 'not-a-real-license',
            isPrivate: true,
            displayName: 'pkg',
        });
    });

    it('skips private packages even when the license is missing', () => {
        assertValidLicense({
            license: undefined,
            isPrivate: true,
            displayName: 'pkg',
        });
    });

    it('throws when the license field is missing', () => {
        assert.throws(
            () =>
                assertValidLicense({
                    license: undefined,
                    isPrivate: false,
                    displayName: 'pkg',
                }),
            {
                matchConstructor: VirmatorNoTraceError,
                matchMessage: "Missing 'license' field in 'pkg'.",
            },
        );
    });

    it('throws when the license field is an empty string', () => {
        assert.throws(
            () =>
                assertValidLicense({
                    license: '',
                    isPrivate: false,
                    displayName: 'pkg',
                }),
            {
                matchConstructor: VirmatorNoTraceError,
                matchMessage: "Missing 'license' field in 'pkg'.",
            },
        );
    });

    it('throws when the license field is a legacy object form', () => {
        assert.throws(
            () =>
                assertValidLicense({
                    // @ts-expect-error: intentionally incorrect license
                    license: {
                        type: 'MIT',
                        url: 'https://example.com/LICENSE',
                    },
                    isPrivate: false,
                    displayName: 'pkg',
                }),
            {
                matchConstructor: VirmatorNoTraceError,
                matchMessage: "Missing 'license' field in 'pkg'.",
            },
        );
    });

    it('throws on an unknown SPDX identifier', () => {
        assert.throws(
            () =>
                assertValidLicense({
                    license: 'not-a-real-license',
                    isPrivate: false,
                    displayName: 'pkg',
                }),
            {
                matchConstructor: VirmatorNoTraceError,
                matchMessage: "Invalid SPDX license expression 'not-a-real-license' in 'pkg'.",
            },
        );
    });

    it('throws on a malformed SPDX expression', () => {
        assert.throws(
            () =>
                assertValidLicense({
                    license: '(MIT OR)',
                    isPrivate: false,
                    displayName: 'pkg',
                }),
            {
                matchConstructor: VirmatorNoTraceError,
                matchMessage: "Invalid SPDX license expression '(MIT OR)' in 'pkg'.",
            },
        );
    });
});
