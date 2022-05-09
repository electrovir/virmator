const baseConfig = require('./.prettierrc-base');


/**
 * @typedef {import('prettier-plugin-multiline-arrays').MultilineArrayOptions} MultilineOptions
 *
 * @typedef {import('prettier').Options} PrettierOptions
 * @type {PrettierOptions & MultilineOptions}
 */
 const prettierConfig = {};

module.exports = {...baseConfig, ...prettierConfig};
