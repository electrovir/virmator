import {assert} from '@augment-vir/assert';
import {randomString} from '@augment-vir/common';
import {
    assertTestContext,
    describe,
    extractTestNameAsDir,
    it,
    TestEnv,
    testWeb,
} from '@augment-vir/test';
import {executeServerCommand} from '@web/test-runner-commands';
import {html} from 'element-vir';
import {
    globalElementStoreKey,
    ScreenshotCommand,
    type CompareScreenshotCommandPayload,
    type CompareScreenshotResult,
    type GlobalThisWithElementStoreKey,
} from './screenshot-payload.js';

describe('screenshotPlugin', () => {
    it('creates a screenshot', async (testContext) => {
        const fixture = await testWeb.render(html`
            <div>Hi!</div>
        `);

        assertTestContext(testContext, TestEnv.Web);

        const elementKey = randomString();
        (globalThis as GlobalThisWithElementStoreKey)[globalElementStoreKey] = {
            [elementKey]: fixture,
        };

        const result: CompareScreenshotResult = await executeServerCommand(
            ScreenshotCommand.CompareScreenshot,
            {
                elementKey,
                screenshotFileName: extractTestNameAsDir(testContext),
            } satisfies CompareScreenshotCommandPayload,
        );

        assert.isTrue(result.passed);
        assert.isFalse(result.updated);
        assert.endsWith(result.screenshotFilePath, 'screenshot_plugin_creates_a_screenshot.png');
    });
});
