/**
 * Path to the dump directory, passed to the test runner child process.
 *
 * Its own module so that `configs/web-test-runner.config.base.mjs` can read it without loading the
 * whole test plugin.
 *
 * @category Internal
 */
export const footprintDirEnvVarName = 'VIRMATOR_FOOTPRINT_DIR';
