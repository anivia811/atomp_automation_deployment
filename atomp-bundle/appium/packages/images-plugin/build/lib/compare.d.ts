import { type MatchingOptions, type SimilarityOptions, type OccurrenceOptions } from '@appium/opencv';
import type { ComparisonResult } from './types';
/**
 * Performs images comparison using OpenCV framework features.
 * It is expected that both OpenCV framework and opencv4nodejs
 * module are installed on the machine where Appium server is running.
 *
 * @param mode - One of possible comparison modes:
 * matchFeatures, getSimilarity, matchTemplate
 * @param firstImage - Base64-encoded image file.
 * All image formats, that OpenCV library itself accepts, are supported.
 * @param secondImage - Base64-encoded image file.
 * All image formats, that OpenCV library itself accepts, are supported.
 * @param options - The content of this dictionary depends
 * on the actual `mode` value. See the documentation on `@appium/support`
 * module for more details.
 * @returns The content of the resulting dictionary depends
 * on the actual `mode` and `options` values. See the documentation on
 * `@appium/support` module for more details.
 * @throws {Error} If required OpenCV modules are not installed or
 * if `mode` value is incorrect or if there was an unexpected issue while
 * matching the images.
 */
export declare function compareImages(mode: string, firstImage: string | Buffer, secondImage: string | Buffer, options?: MatchingOptions | SimilarityOptions | OccurrenceOptions): Promise<ComparisonResult>;
//# sourceMappingURL=compare.d.ts.map