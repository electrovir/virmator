import {
    mergeDefinedProperties,
    type Dimensions,
    type RequiredAndNotNull,
} from '@augment-vir/common';
import {readFile} from 'node:fs/promises';
import pixelmatch from 'pixelmatch';
import {PNG} from 'pngjs';
import sharp from 'sharp';
import {type ImageComparisonOptions, type ImageComparisonResult} from './compare-images-types.js';

/**
 * Default image comparison options used in {@link compareImages}.
 *
 * @category Internal
 */
export const defaultImageComparisonOptions: Readonly<RequiredAndNotNull<ImageComparisonOptions>> = {
    threshold: 0.1,
    maxDiffPixelRatio: 0.1,
};

export async function padImage(image: Buffer, {height, width}: Dimensions) {
    const meta = await sharp(image).metadata();
    if (!meta.width || !meta.height) {
        throw new Error('Unable to read image dimensions.');
    }

    const extendRight = width - meta.width;
    const extendBottom = height - meta.height;

    if (extendRight === 0 && extendBottom === 0) {
        return image;
    }

    return await sharp(image)
        .extend({
            top: 0,
            bottom: extendBottom,
            left: 0,
            right: extendRight,
            extendWith: 'copy',
        })
        .png()
        .toBuffer();
}

/**
 * Pads both images to the same canvas size (max width/height of the two) without scaling, then
 * returns the decoded PNGs and the shared dimensions.
 *
 * @category Internal
 */
export async function padToSameCanvas({aBuf, bBuf}: Readonly<{aBuf: Buffer; bBuf: Buffer}>) {
    const [
        aMeta,
        bMeta,
    ] = await Promise.all([
        sharp(aBuf).metadata(),
        sharp(bBuf).metadata(),
    ]);
    if (!aMeta.width || !aMeta.height || !bMeta.width || !bMeta.height) {
        throw new Error('Unable to read image dimensions.');
    }
    const dimensions: Readonly<Dimensions> = {
        width: Math.max(aMeta.width, bMeta.width),
        height: Math.max(aMeta.height, bMeta.height),
    };

    const [
        aPadded,
        bPadded,
    ] = await Promise.all([
        padImage(aBuf, dimensions),
        padImage(bBuf, dimensions),
    ]);
    const aPng = PNG.sync.read(aPadded);
    const bPng = PNG.sync.read(bPadded);
    return {
        aPng,
        bPng,
        dimensions,
    };
}

export async function readImageDimensions(imageFilePath: string): Promise<Dimensions> {
    const meta = await sharp(await readFile(imageFilePath)).metadata();

    return {
        height: meta.height,
        width: meta.width,
    };
}

/**
 * Compare two PNG image buffers pixel-by-pixel. The images may have different dimensions — they
 * will be padded to the same canvas size before comparison.
 *
 * This function is fully Playwright-agnostic and can be used in any Node.js context.
 *
 * @category Internal
 */
export async function compareImages({
    baseImageBuffer,
    currentImageBuffer,
    userOptions,
}: Readonly<{
    baseImageBuffer: Buffer;
    currentImageBuffer: Buffer;
    userOptions?: Readonly<ImageComparisonOptions> | undefined;
}>): Promise<ImageComparisonResult> {
    const options = mergeDefinedProperties(defaultImageComparisonOptions, userOptions);

    const {
        aPng: basePng,
        bPng: currentPng,
        dimensions,
    } = await padToSameCanvas({
        aBuf: baseImageBuffer,
        bBuf: currentImageBuffer,
    });

    const diffPng = new PNG(dimensions);
    const diffPixelCount = pixelmatch(
        basePng.data,
        currentPng.data,
        diffPng.data,
        dimensions.width,
        dimensions.height,
        {
            threshold: options.threshold,
        },
    );

    const totalPixels = dimensions.width * dimensions.height;
    const diffRatio = diffPixelCount / totalPixels;
    const passed = diffRatio <= options.maxDiffPixelRatio;

    return {
        passed,
        diffPixelCount,
        totalPixels,
        diffRatio,
        dimensions,
        basePng,
        currentPng,
        diffPng,
    };
}

/**
 * Encode a {@link PNG} instance to a `Buffer`.
 *
 * @category Internal
 */
export function encodePng(png: PNG): Buffer {
    return PNG.sync.write(png);
}
