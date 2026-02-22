import {
    getObjectTypedKeys,
    type Dimensions,
    type ExtractKeysWithMatchingValues,
} from '@augment-vir/common';
import {defineShape, nullableShape} from 'object-shape-tester';
import {type PNG} from 'pngjs';

/**
 * Shape definition for {@link ImageComparisonOptions}.
 *
 * @category Internal
 */
export const imageComparisonOptionsShape = defineShape({
    /**
     * Per-pixel color threshold for `pixelmatch` (0–1). Smaller values make comparison more
     * sensitive.
     */
    threshold: nullableShape(-1),
    /** Maximum ratio of differing pixels allowed before the comparison is considered a failure. */
    maxDiffPixelRatio: nullableShape(-1),
});

/**
 * Options for image comparison thresholds.
 *
 * @category Internal
 */
export type ImageComparisonOptions = typeof imageComparisonOptionsShape.runtimeType;

/**
 * The result of comparing two images via `compareImages`.
 *
 * @category Internal
 */
export type ImageComparisonResult = {
    /** Whether the images match within the allowed diff ratio. */
    passed: boolean;
    /** The number of differing pixels. */
    diffPixelCount: number;
    /** Total pixel count of the (padded) comparison canvas. */
    totalPixels: number;
    /** The ratio of differing pixels to total pixels. */
    diffRatio: number;
    /** The dimensions of the comparison canvas. */
    dimensions: Readonly<Dimensions>;
    /** PNG data for the base image (padded to the comparison canvas). */
    basePng: PNG;
    /** PNG data for the current image (padded to the comparison canvas). */
    currentPng: PNG;
    /** PNG data for the visual diff output. */
    diffPng: PNG;
};

/**
 * Used to omit PNG results from serializing to the frontend.
 *
 * @category Internal
 */
export const imageComparisonResultKeysWithPngValues = getObjectTypedKeys({
    basePng: true,
    currentPng: true,
    diffPng: true,
} satisfies Record<ExtractKeysWithMatchingValues<ImageComparisonResult, PNG>, true>);
