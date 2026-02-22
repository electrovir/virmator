import {type ArrayElement} from '@augment-vir/common';
import {intersectShape} from 'object-shape-tester';
import {
    imageComparisonOptionsShape,
    type ImageComparisonResult,
    type imageComparisonResultKeysWithPngValues,
} from './compare-images-types.js';

export enum ScreenshotCommand {
    CompareScreenshot = 'compare-screenshot',
}

export type CompareScreenshotCommandPayload =
    typeof compareScreenshotCommandPayloadShape.runtimeType;

export const compareScreenshotCommandPayloadShape = intersectShape(imageComparisonOptionsShape, {
    /** Name of the file that the screenshot should be saved to. `.png` is forced as the extension. */
    screenshotFileName: '',
    /** A random string id for tracking which element should be screenshot. */
    elementKey: '',
});

export type RawCompareScreenshotResult = Omit<
    ImageComparisonResult,
    ArrayElement<typeof imageComparisonResultKeysWithPngValues>
> & {
    /** A path relative to the repo where the screenshot was ultimately saved. */
    screenshotFilePath: string;
};

export type CompareScreenshotResult =
    | (RawCompareScreenshotResult & {
          updated: false;
      })
    | (Partial<Record<keyof RawCompareScreenshotResult, undefined>> & {
          updated: true;
      });

export const globalElementStoreKey = '__WTR_SCREENSHOT_PLUGIN__' as const;
export type GlobalThisWithElementStoreKey = typeof globalThis & {
    [globalElementStoreKey]?: Record<string, Element>;
};
