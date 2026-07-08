import { Buffer } from 'node:buffer';
import type { MatchingOptions, MatchingResult, SimilarityOptions, SimilarityResult, OccurrenceOptions, OccurrenceResult } from './types';
export declare const DEFAULT_MATCH_THRESHOLD = 0.5;
export declare const MATCH_NEIGHBOUR_THRESHOLD = 10;
export declare const AVAILABLE_DETECTORS: {
    readonly AKAZE: "AKAZE";
    readonly AGAST: "AgastFeatureDetector";
    readonly BRISK: "BRISK";
    readonly FAST: "FastFeatureDetector";
    readonly GFTT: "GFTTDetector";
    readonly KAZE: "KAZE";
    readonly MSER: "MSER";
    readonly ORB: "ORB";
};
export declare const AVAILABLE_MATCHING_FUNCTIONS: {
    readonly FlannBased: "FlannBased";
    readonly BruteForce: "BruteForce";
    readonly BruteForceL1: "BruteForce-L1";
    readonly BruteForceHamming: "BruteForce-Hamming";
    readonly BruteForceHammingLut: "BruteForce-HammingLUT";
    readonly BruteForceSL2: "BruteForce-SL2";
};
/**
 * Initializes the OpenCV bindings library.
 * Spins until the opencv-bindings module is fully loaded.
 * You only need to explicitly call this if you want to use your own opencv
 * methods that are not included in this module.
 *
 * @example
 * ```ts
 * import {initOpenCv} from '@appium/opencv';
 * await initOpenCv();
 * ```
 */
export declare function initOpenCv(): Promise<void>;
/**
 * Calculates the count of common edges between two images.
 * The images might be rotated or resized relatively to each other.
 * This method uses feature-based matching which is useful when images are rotated/scaled.
 *
 * Read https://docs.opencv.org/3.0-beta/doc/py_tutorials/py_feature2d/py_matcher/py_matcher.html
 * for more details on feature-based matching.
 *
 * @param img1Data - The data of the first image packed into a NodeJS buffer
 * @param img2Data - The data of the second image packed into a NodeJS buffer
 * @param options - Set of matching options (see {@link MatchingOptions})
 * @returns Matching result containing count, totalCount, points, rects, and optionally visualization
 * @throws {Error} If `detectorName` or `matchFunc` value is unknown, or if no matches can be found between images
 *
 * @example
 * ```ts
 * import {getImagesMatches} from '@appium/opencv';
 * import {fs} from '@appium/support';
 *
 * const image1 = await fs.readFile('image1.jpg');
 * const image2 = await fs.readFile('image2.jpg');
 * const {points1, rect1, points2, rect2, totalCount, count} = await getImagesMatches(image1, image2);
 * ```
 */
export declare function getImagesMatches(img1Data: Buffer, img2Data: Buffer, options?: MatchingOptions): Promise<MatchingResult>;
/**
 * Calculates the similarity score between two images.
 * It is expected that both images have the same resolution.
 * This method uses template matching to compare images pixel-by-pixel.
 *
 * Read https://docs.opencv.org/3.0-beta/doc/py_tutorials/py_imgproc/py_template_matching/py_template_matching.html
 * for more details on template matching.
 *
 * @param img1Data - The data of the first image packed into a NodeJS buffer
 * @param img2Data - The data of the second image packed into a NodeJS buffer
 * @param options - Set of similarity calculation options (see {@link SimilarityOptions})
 * @returns Similarity result containing score (float in range [0.0, 1.0], where 1.0 means images are totally equal) and optionally visualization
 * @throws {Error} If the given images have different resolution
 *
 * @example
 * ```ts
 * import {getImagesSimilarity} from '@appium/opencv';
 * import {fs} from '@appium/support';
 *
 * const image1 = await fs.readFile('image1.jpg');
 * const image2 = await fs.readFile('image2.jpg');
 * const {score} = await getImagesSimilarity(image1, image2);
 * ```
 */
export declare function getImagesSimilarity(img1Data: Buffer, img2Data: Buffer, options?: SimilarityOptions): Promise<SimilarityResult>;
/**
 * Calculates the occurrence position of a partial image in the full image.
 * This method uses template matching to find where the partial image appears in the full image.
 *
 * Read https://docs.opencv.org/3.0-beta/doc/py_tutorials/py_imgproc/py_template_matching/py_template_matching.html
 * for more details on template matching.
 *
 * @param fullImgData - The data of the full image packed into a NodeJS buffer
 * @param partialImgData - The data of the partial image packed into a NodeJS buffer
 * @param options - Set of occurrence calculation options (see {@link OccurrenceOptions})
 * @returns Occurrence result containing rect (region of the partial image occurrence on the full image), score (similarity score as float in range [0.0, 1.0]), optionally visualization, and optionally multiple (array of matching results when multiple option is enabled)
 * @throws {Error} If no occurrences of the partial image can be found in the full image
 *
 * @example
 * ```ts
 * import {getImageOccurrence} from '@appium/opencv';
 * import {fs} from '@appium/support';
 *
 * const fullImage = await fs.readFile('full-image.jpg');
 * const partialImage = await fs.readFile('partial-image.jpg');
 * const {rect, score} = await getImageOccurrence(fullImage, partialImage);
 * ```
 */
export declare function getImageOccurrence(fullImgData: Buffer, partialImgData: Buffer, options?: OccurrenceOptions): Promise<OccurrenceResult>;
export type { MatchingOptions, MatchingResult, SimilarityOptions, SimilarityResult, OccurrenceOptions, OccurrenceResult, };
//# sourceMappingURL=index.d.ts.map