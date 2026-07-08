import type { Rect } from '@appium/types';
import type { ImageElementFinder } from './finder';
import type { MatchingResult, OccurrenceResult, SimilarityResult } from '@appium/opencv';
import type { IMAGE_EL_TAP_STRATEGY_W3C, IMAGE_EL_TAP_STRATEGY_MJSONWP } from './constants';
/**
 * Image settings interface for device settings
 */
export interface ImageSettings {
    imageMatchThreshold: number;
    imageMatchMethod: string;
    fixImageFindScreenshotDims: boolean;
    fixImageTemplateSize: boolean;
    fixImageTemplateScale: boolean;
    defaultImageTemplateScale: number;
    checkForImageElementStaleness: boolean;
    autoUpdateImageElementPosition: boolean;
    imageElementTapStrategy: typeof IMAGE_EL_TAP_STRATEGY_W3C | typeof IMAGE_EL_TAP_STRATEGY_MJSONWP;
    getMatchedImageResult: boolean;
}
/**
 * Options for finding elements by image
 */
export interface FindByImageOptions {
    /** whether this call to find an image is merely to check staleness.
     * If so we can bypass a lot of logic */
    shouldCheckStaleness?: boolean;
    /** Whether we are finding one element or multiple */
    multiple?: boolean;
    /** Whether we ignore defaultImageTemplateScale. It can be used when you would like to
     * scale template with defaultImageTemplateScale setting. */
    ignoreDefaultImageTemplateScale?: boolean;
    /** The bounding rectangle to limit the search in */
    containerRect?: Rect | null;
}
/**
 * Options for creating an ImageElement
 */
export interface ImageElementOpts {
    /** the image which was used to find this ImageElement */
    template: Buffer;
    /** bounds of matched image element */
    rect: Rect;
    /** The similarity score as a float number in range [0.0, 1.0]. 1.0 is the highest
     * score (means both images are totally equal). */
    score: number;
    /** the image which has matched marks. Defaults to null. */
    match?: Buffer | null;
    /** the finder we can use to re-check stale elements */
    finder?: ImageElementFinder | null;
    /** The bounding rectangle to limit the search in */
    containerRect?: Rect | null;
}
/**
 * Dimension interface for width and height
 */
export interface Dimension {
    width: number;
    height: number;
}
/**
 * Position interface for x and y coordinates
 */
export interface Position {
    x: number;
    y: number;
}
/**
 * Screenshot interface
 */
export interface Screenshot {
    screenshot: Buffer;
}
/**
 * Screenshot scale interface
 */
export interface ScreenshotScale {
    xScale: number;
    yScale: number;
}
/**
 * Image template settings for scaling
 */
export interface ImageTemplateSettings {
    /** fixImageTemplateScale in device-settings */
    fixImageTemplateScale?: boolean;
    /** defaultImageTemplateScale in device-settings */
    defaultImageTemplateScale?: number;
    /** Ignore defaultImageTemplateScale if it has true. If the template
     * has been scaled to defaultImageTemplateScale or should ignore the scale,
     * this parameter should be true. e.g. click in image-element module */
    ignoreDefaultImageTemplateScale?: boolean;
    /** Scale ratio for width */
    xScale?: number;
    /** Scale ratio for height */
    yScale?: number;
}
/**
 * Occurrence result with visualization (string instead of Buffer)
 */
export interface OccurrenceResultWithVisualization {
    rect: Rect;
    score: number;
    visualization?: string | null;
}
/**
 * Interface for results with string visualization instead of Buffer
 */
export interface Visualized {
    visualization?: string | null;
}
/**
 * Matching result with string visualization
 */
export type VisualizedMatchingResult = MatchingResult & Visualized;
/**
 * Occurrence result with string visualization
 */
export type VisualizedOccurrenceResult = OccurrenceResult & Visualized;
/**
 * Similarity result with string visualization
 */
export type VisualizedSimilarityResult = SimilarityResult & Visualized;
/**
 * Result type for image comparison operations
 */
export type ComparisonResult = VisualizedMatchingResult | VisualizedOccurrenceResult | VisualizedSimilarityResult | VisualizedSimilarityResult[];
//# sourceMappingURL=types.d.ts.map