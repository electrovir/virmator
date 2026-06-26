import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import rule from './no-should-in-test-description.lint.js';

const ruleTester = new RuleTester();

describe('no-should-in-test-description', () => {
    it('allows declarative descriptions', () => {
        ruleTester.run('allows-declarative', rule, {
            valid: [
                {
                    name: 'declarative present tense literal',
                    code: "it('strips maiden name', () => {});",
                },
                {
                    name: 'declarative describe block',
                    code: "describe('the parser', () => {});",
                },
                {
                    name: 'declarative test call',
                    code: "test('parses a comma format', () => {});",
                },
                {
                    name: 'declarative template literal',
                    code: 'it(`returns the value`, () => {});',
                },
                {
                    name: 'it.only with declarative description',
                    code: "it.only('handles empty input', () => {});",
                },
                {
                    name: 'declarative it property in an itCases table',
                    code: "const cases = [{it: 'returns the value', test: () => {}}];",
                },
                {
                    name: 'non-it property starting with should is ignored',
                    code: "const config = {description: 'should not be flagged'};",
                },
                {
                    name: 'computed it key is ignored',
                    code: "const table = {[it]: 'should ignore computed key'};",
                },
            ],
            invalid: [],
        });
    });

    it('ignores near-miss cases', () => {
        ruleTester.run('ignores-near-miss', rule, {
            valid: [
                {
                    name: 'shouldered is not the word should',
                    code: "it('shoulders the load', () => {});",
                },
                {
                    name: 'should not at the start',
                    code: "it('the value should match', () => {});",
                },
                {
                    name: 'non-test function named should',
                    code: "expect('should do this', () => {});",
                },
                {
                    name: 'method on unrelated object',
                    code: "thing.it('should do this', () => {});",
                },
                {
                    name: 'first argument is not a string',
                    code: 'it(someDescription, () => {});',
                },
                {
                    name: 'template literal with interpolation',
                    code: 'it(`should ${verb}`, () => {});',
                },
                {
                    name: 'no arguments',
                    code: 'it();',
                },
            ],
            invalid: [],
        });
    });

    it('flags descriptions starting with should', () => {
        ruleTester.run('flags-should', rule, {
            valid: [],
            invalid: [
                {
                    name: 'lowercase should literal',
                    code: "it('should strip maiden name', () => {});",
                    errors: [
                        {
                            messageId: 'noShould',
                        },
                    ],
                },
                {
                    name: 'capitalized Should literal',
                    code: "test('Should parse the value', () => {});",
                    errors: [
                        {
                            messageId: 'noShould',
                        },
                    ],
                },
                {
                    name: 'should in describe',
                    code: 'describe("should handle errors", () => {});',
                    errors: [
                        {
                            messageId: 'noShould',
                        },
                    ],
                },
                {
                    name: 'should in it.only member expression',
                    code: "it.only('should run first', () => {});",
                    errors: [
                        {
                            messageId: 'noShould',
                        },
                    ],
                },
                {
                    name: 'should in test.skip member expression',
                    code: "test.skip('should be skipped', () => {});",
                    errors: [
                        {
                            messageId: 'noShould',
                        },
                    ],
                },
                {
                    name: 'should in plain template literal',
                    code: 'it(`should return the value`, () => {});',
                    errors: [
                        {
                            messageId: 'noShould',
                        },
                    ],
                },
                {
                    name: 'should in an itCases it property',
                    code: "const cases = [{it: 'should strip the name', test: () => {}}];",
                    errors: [
                        {
                            messageId: 'noShould',
                        },
                    ],
                },
                {
                    name: 'should in an it property template literal',
                    code: 'const cases = [{it: `should return the value`, test: () => {}}];',
                    errors: [
                        {
                            messageId: 'noShould',
                        },
                    ],
                },
            ],
        });
    });
});
