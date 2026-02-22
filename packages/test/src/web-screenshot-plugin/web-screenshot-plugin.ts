/**
 * This is inspired from but behaves very different from the visual diff provided by
 * [`@web/test-runner-visual-regression`](https://www.npmjs.com/package/@web/test-runner-visual-regression).
 */

import {
    awaitedBlockingMap,
    awaitedForEach,
    getObjectTypedValues,
    log,
    omitObjectKeys,
    replaceExtension,
} from '@augment-vir/common';
import {joinFilesToDir, writeFileAndDir} from '@augment-vir/node';
import {type TestRunnerPlugin} from '@web/test-runner-core';
import type {PlaywrightLauncher} from '@web/test-runner-playwright';
import {existsSync} from 'node:fs';
import {readdir, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, relative} from 'node:path';
import {assertValidShape} from 'object-shape-tester';
import {imageComparisonResultKeysWithPngValues} from './compare-images-types.js';
import {compareImages, encodePng, padImage, readImageDimensions} from './compare-images.js';
import {
    compareScreenshotCommandPayloadShape,
    globalElementStoreKey,
    ScreenshotCommand,
    type CompareScreenshotCommandPayload,
    type CompareScreenshotResult,
    type GlobalThisWithElementStoreKey,
} from './screenshot-payload.js';

type TempScreenshotInfo = {
    finalWritePath: string;
    screenshotFileName: string;
    tempDirPath: string;
};

export function screenshotPlugin(
    packageRootDirPath: string,
): TestRunnerPlugin<CompareScreenshotCommandPayload> {
    const updatesAllowed = process.argv.includes('--update');
    const tempDirPath = join(tmpdir(), 'wtr-screenshot-plugin');
    const tempScreenshotsDirPath = join(tempDirPath, 'screenshots');
    let debugScreenshotsWritten = false;
    const debugDirPath = join(tempDirPath, 'debug');
    const screenshotStore: Record<string, Readonly<TempScreenshotInfo>> = {};

    return {
        name: 'compare-screenshot-command',

        async serverStart() {
            await rm(tempScreenshotsDirPath, {
                force: true,
                recursive: true,
            });
            await rm(debugDirPath, {
                force: true,
                recursive: true,
            });
        },

        async serverStop() {
            if (debugScreenshotsWritten) {
                log.mutate(`Failure debugging screenshots written to: ${debugDirPath}`);
            }

            await awaitedForEach(
                getObjectTypedValues(screenshotStore),
                async ({finalWritePath, screenshotFileName, tempDirPath}) => {
                    const tempScreenshotFilePaths = joinFilesToDir(
                        tempDirPath,
                        await readdir(tempDirPath),
                    );
                    const dimensions = await awaitedBlockingMap(
                        tempScreenshotFilePaths,
                        async (filePath) => {
                            return {
                                filePath,
                                dimensions: await readImageDimensions(filePath),
                            };
                        },
                    );
                    const maximums = dimensions.reduce(
                        (accum, current) => {
                            accum.maxWidth = Math.max(accum.maxWidth, current.dimensions.width);
                            accum.maxHeight = Math.max(accum.maxHeight, current.dimensions.height);

                            const currentPixelCount =
                                current.dimensions.height * current.dimensions.width;
                            if (currentPixelCount > accum.filePixelCount) {
                                accum.filePixelCount = currentPixelCount;
                                accum.filePath = current.filePath;
                            }

                            return accum;
                        },
                        {
                            filePath: '',
                            filePixelCount: 0,
                            maxHeight: 0,
                            maxWidth: 0,
                        },
                    );

                    if (!maximums.filePath) {
                        log.error(
                            `Failed to write final screenshot for '${screenshotFileName}': no maximum file name found.`,
                        );
                        return;
                    }

                    const finalScreenshot = await padImage(await readFile(maximums.filePath), {
                        width: maximums.maxWidth,
                        height: maximums.maxHeight,
                    });

                    await writeFileAndDir(finalWritePath, finalScreenshot);

                    log.mutate(`Updated screenshot: ${relative(process.cwd(), finalWritePath)}`);
                },
            );
        },

        async executeCommand({
            command,
            payload: rawPayload,
            session,
        }): Promise<CompareScreenshotResult | undefined> {
            if (command === ScreenshotCommand.CompareScreenshot) {
                assertValidShape(
                    rawPayload,
                    compareScreenshotCommandPayloadShape,
                    {
                        allowExtraKeys: true,
                    },
                    'Invalid screenshot comparison payload.',
                );
                const payload = rawPayload;

                if (session.browser.type === 'playwright') {
                    const browser = session.browser as PlaywrightLauncher;
                    const page = browser.getPage(session.id);

                    const elementHandle = await page.evaluateHandle(
                        ({elementKey, globalStoreKey}) => {
                            return (globalThis as GlobalThisWithElementStoreKey)[globalStoreKey]?.[
                                elementKey
                            ];
                        },
                        {
                            elementKey: payload.elementKey,
                            globalStoreKey: globalElementStoreKey,
                        },
                    );

                    const element = elementHandle.asElement();
                    if (!element) {
                        throw new Error('Failed to find element to screenshot.');
                    }

                    const newScreenshot = await element.screenshot();

                    const screenshotsDirPath = session.testFile + '.screenshots';
                    const screenshotFileName = replaceExtension({
                        path: payload.screenshotFileName,
                        newExtension: '.png',
                    });

                    const screenshotFilePath = join(screenshotsDirPath, screenshotFileName);

                    if (updatesAllowed) {
                        const tempDirPath = join(tempScreenshotsDirPath, screenshotsDirPath);

                        screenshotStore[payload.screenshotFileName] = {
                            finalWritePath: screenshotFilePath,
                            tempDirPath,
                            screenshotFileName,
                        };
                        const tempScreenshotFilePath = join(
                            tempDirPath,
                            `${browser.name.toLowerCase()}.png`,
                        );

                        await writeFileAndDir(tempScreenshotFilePath, newScreenshot);

                        return {
                            updated: true,
                        };
                    } else {
                        if (!existsSync(screenshotFilePath)) {
                            throw new Error(
                                'Base screenshot path does not exist. Run with --update to update screenshots.',
                            );
                        }

                        const baseScreenshot: Buffer = await readFile(screenshotFilePath);
                        const result = await compareImages(baseScreenshot, newScreenshot, payload);

                        if (!result.passed) {
                            const screenshotDebugOutputsDirPath = join(
                                debugDirPath,
                                relative(process.cwd(), screenshotFilePath),
                            );

                            await writeFileAndDir(
                                join(
                                    screenshotDebugOutputsDirPath,
                                    browser.name.toLowerCase() + '_actual.png',
                                ),
                                encodePng(result.currentPng),
                            );
                            await writeFileAndDir(
                                join(
                                    screenshotDebugOutputsDirPath,
                                    browser.name.toLowerCase() + '_diff.png',
                                ),
                                encodePng(result.diffPng),
                            );
                            await writeFileAndDir(
                                join(
                                    screenshotDebugOutputsDirPath,
                                    browser.name.toLowerCase() + '_expected.png',
                                ),
                                encodePng(result.basePng),
                            );
                            await writeFileAndDir(
                                join(
                                    screenshotDebugOutputsDirPath,
                                    browser.name.toLowerCase() + '_result.json',
                                ),
                                JSON.stringify(
                                    omitObjectKeys(result, imageComparisonResultKeysWithPngValues),
                                    null,
                                    4,
                                ),
                            );
                            debugScreenshotsWritten = true;
                        }

                        return {
                            ...omitObjectKeys(result, imageComparisonResultKeysWithPngValues),
                            screenshotFilePath: relative(packageRootDirPath, screenshotFilePath),
                            updated: false,
                        };
                    }
                }

                throw new Error(
                    `Browser "${session.browser.type}" is not yet supported for screenshot comparison. Only Playwright is supported.`,
                );
            }

            return undefined;
        },
    };
}
