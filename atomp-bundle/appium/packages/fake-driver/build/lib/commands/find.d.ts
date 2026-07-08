import type { Element } from '@appium/types';
import { FakeElement, type XmlNodeLike } from '../fake-element';
import type { FakeDriver } from '../driver';
/** Find an existing element id in elMap for the same underlying node (reference equality). */
export declare function getExistingElementForNode(this: FakeDriver, node: FakeElement): string | null;
/** Accepts either a FakeElement (reuse existing id) or a raw XmlNodeLike from xpath. */
export declare function wrapNewEl(this: FakeDriver, obj: FakeElement | XmlNodeLike): Element;
/** findElOrElsImpl. */
declare function findElOrElsImpl<Ctx = unknown>(this: FakeDriver, strategy: string, selector: string, mult: true, context?: Ctx): Promise<Element[]>;
/** findElOrElsImpl. */
declare function findElOrElsImpl<Ctx = unknown>(this: FakeDriver, strategy: string, selector: string, mult: false, context?: Ctx): Promise<Element>;
export declare const findElOrEls: typeof findElOrElsImpl;
/** findElement. */
export declare function findElement(this: FakeDriver, strategy: string, selector: string): Promise<Element>;
/** findElements. */
export declare function findElements(this: FakeDriver, strategy: string, selector: string): Promise<Element[]>;
/** findElementFromElement. */
export declare function findElementFromElement(this: FakeDriver, strategy: string, selector: string, elementId: string): Promise<Element>;
/** findElementsFromElement. */
export declare function findElementsFromElement(this: FakeDriver, strategy: string, selector: string, elementId: string): Promise<Element[]>;
export {};
//# sourceMappingURL=find.d.ts.map