import { ImageElement } from './image-element';
import type { ExternalDriver, Element, Size } from '@appium/types';
import type { FindByImageOptions, Screenshot, ScreenshotScale, ImageTemplateSettings } from './types';
export declare class ImageElementFinder {
    private _imgElCache;
    constructor(max?: number);
    registerImageElement(imgEl: ImageElement): Element;
    getImageElement(imgElId: string): ImageElement | undefined;
    clearImageElements(): void;
    /**
     * Find a screen rect represented by an ImageElement corresponding to an image
     * template sent in by the client
     *
     * @param template - image used as a template to be matched in the screenshot
     * @param driver
     * @param opts - additional options
     *
     * @returns WebDriver element with a special id prefix
     */
    findByImage(template: Buffer, driver: ExternalDriver, { shouldCheckStaleness, multiple, ignoreDefaultImageTemplateScale, containerRect, }?: FindByImageOptions): Promise<Element | Element[] | ImageElement>;
    /**
     * Ensure that the image template sent in for a find is of a suitable size
     *
     * @param template - template image
     * @param maxSize - size of the bounding rectangle
     *
     * @returns image, potentially resized
     */
    ensureTemplateSize(template: Buffer, maxSize: Size): Promise<Buffer>;
    /**
     * Get the screenshot image that will be used for find by element, potentially
     * altering it in various ways based on user-requested settings
     *
     * @param driver
     * @param screenSize - The original size of the screen
     *
     * @returns PNG screenshot and ScreenshotScale
     */
    getScreenshotForImageFind(driver: ExternalDriver, screenSize: Size): Promise<Screenshot & {
        scale?: ScreenshotScale;
    }>;
    /**
     * Get a image that will be used for template matching.
     * Returns scaled image if scale ratio is provided.
     *
     * @param template - image used as a template to be matched in the screenshot
     * @param opts - Image template scale related options
     *
     * @returns scaled template screenshot
     */
    fixImageTemplateScale(template: Buffer, opts?: ImageTemplateSettings): Promise<Buffer>;
}
//# sourceMappingURL=finder.d.ts.map