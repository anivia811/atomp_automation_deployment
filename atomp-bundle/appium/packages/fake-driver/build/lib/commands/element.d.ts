import type { FakeDriver } from '../driver';
import type { Position, Rect, Size } from '@appium/types';
import type { FakeElement } from '../fake-element';
/** Resolve element ids to FakeElements; throws StaleElementReferenceError if any id is missing. */
export declare function getElements(this: FakeDriver, elementIds: string[]): FakeElement[];
/** getElement. */
export declare function getElement(this: FakeDriver, elementId: string): FakeElement;
/** getName. */
export declare function getName(this: FakeDriver, elementId: string): Promise<string>;
/** elementDisplayed. */
export declare function elementDisplayed(this: FakeDriver, elementId: string): Promise<boolean>;
/** elementEnabled. */
export declare function elementEnabled(this: FakeDriver, elementId: string): Promise<boolean>;
/** elementSelected. */
export declare function elementSelected(this: FakeDriver, elementId: string): Promise<boolean>;
/** setValue. */
export declare function setValue(this: FakeDriver, keys: string | string[], elementId: string): Promise<void>;
/** getText. */
export declare function getText(this: FakeDriver, elementId: string): Promise<string>;
/** clear. */
export declare function clear(this: FakeDriver, elementId: string): Promise<void>;
/** click. */
export declare function click(this: FakeDriver, elementId: string): Promise<void>;
/** Protocol order: attribute name, then element id (from route /attribute/:name). */
export declare function getAttribute(this: FakeDriver, attributeName: string, elementId: string): Promise<string>;
/** getElementRect. */
export declare function getElementRect(this: FakeDriver, elementId: string): Promise<Rect>;
/** getSize. */
export declare function getSize(this: FakeDriver, elementId: string): Promise<Size>;
/** equalsElement. */
export declare function equalsElement(this: FakeDriver, elementIdA: string, elementIdB: string): Promise<boolean>;
/** Protocol order: property name, then element id. Requires webview context. */
export declare function getCssProperty(this: FakeDriver, propertyName: string, elementId: string): Promise<string>;
/** getLocation. */
export declare function getLocation(this: FakeDriver, elementId: string): Promise<Position>;
/** getLocationInView. */
export declare function getLocationInView(this: FakeDriver, elementId: string): Promise<Position>;
//# sourceMappingURL=element.d.ts.map