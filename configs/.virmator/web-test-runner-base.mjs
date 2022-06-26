import {esbuildPlugin} from '@web/dev-server-esbuild';
import {playwrightLauncher} from '@web/test-runner-playwright';

/** @type {import('@web/test-runner').TestRunnerConfig} */
const webTestRunnerConfig = {
    files: [
        'src/test/**/*.test.ts',
    ],
    plugins: [esbuildPlugin({ts: true})],
    coverage: true,
    nodeResolve: true,
    browsers: [
        playwrightLauncher({product: 'chromium'}),
        playwrightLauncher({product: 'firefox'}),
        playwrightLauncher({product: 'webkit'}),
    ],
};

export default webTestRunnerConfig;
