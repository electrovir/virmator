const allChildTestFilesGlob = '**/!(*.type).test.ts?(x)';

const configFileIndex = process.argv.findIndex((arg) => arg.match(/\.config\.[cm]?[tj]s$/));
const possibleTestFilesOrDirs = process.argv
    .slice(configFileIndex + 1)
    .filter((arg) => !arg.startsWith('-'));
const specificTests = possibleTestFilesOrDirs.map((arg) =>
    arg.endsWith('.ts') ? arg : `${arg}/${allChildTestFilesGlob}`,
);

module.exports = specificTests.length
    ? {spec: specificTests}
    : {spec: [`src/${allChildTestFilesGlob}`]};
