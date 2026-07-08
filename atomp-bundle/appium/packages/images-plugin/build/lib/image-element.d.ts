import type { Rect, Element, ExternalDriver } from '@appium/types';
import type { ImageElementFinder } from './finder';
import type { Dimension, Position, ImageElementOpts } from './types';
/**
 * Representation of an "image element", which is simply a set of coordinates
 * and methods that can be used on that set of coordinates via the driver
 */
export declare class ImageElement {
    readonly template: Buffer;
    rect: Rect;
    readonly id: string;
    readonly match: Buffer | null;
    readonly score: number;
    readonly finder: ImageElementFinder | null;
    readonly containerRect: Rect | null;
    constructor({ template, rect, score, match, finder, containerRect, }: ImageElementOpts);
    /**
     * @returns dimension of element
     */
    get size(): Dimension;
    /**
     * @returns coordinates of top-left corner of element
     */
    get location(): Position;
    /**
     * @returns coordinates of center of element
     */
    get center(): Position;
    /**
     * @returns the base64-encoded original image used for matching
     */
    get originalImage(): string;
    /**
     * @returns the base64-encoded image which has matched marks
     */
    get matchedImage(): string | null;
    /**
     * Handle various Appium commands that involve an image element
     *
     * @param driver - the driver to use for commands
     * @param cmd - the name of the driver command
     * @param imgEl - image element object
     * @param args - Rest of arguments for executeScripts
     *
     * @returns the result of running a command
     */
    static execute(driver: ExternalDriver, imgEl: ImageElement, cmd: string, ...args: any[]): Promise<any>;
    /**
     *
     * @returns this image element as a WebElement
     */
    asElement(): Element;
    /**
     * @param other - an ImageElement to compare with this one
     *
     * @returns whether the other element and this one have the same properties
     */
    equals(other: ImageElement): boolean;
    /**
     * Use a driver to tap the screen at the center of this ImageElement's
     * position
     *
     * @param driver - driver for calling actions with
     */
    click(driver: ExternalDriver): Promise<void>;
    /**
     * Perform lookup of image element(s) inside of the current element
     *
     * @param multiple - Whether to lookup multiple elements
     * @param driver - The driver to use for commands
     * @param args - Rest of arguments for executeScripts
     * @returns WebDriver element with a special id prefix
     */
    find(multiple: boolean, driver: ExternalDriver, ...args: any[]): Promise<Element | Element[] | ImageElement>;
}
//# sourceMappingURL=image-element.d.ts.map