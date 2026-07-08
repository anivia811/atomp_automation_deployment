import type { Document as XMLDocument } from '@xmldom/xmldom';
import type { FakeApp } from './fake-app';
export interface XmlNodeLike {
    tagName: string;
    attributes: {
        name: string;
        value: string;
    }[];
}
/** Wrapper around an XML node from the fake app DOM; supports attrs, css, visibility, click, alerts. */
export declare class FakeElement {
    readonly app: FakeApp;
    readonly type: string;
    readonly nodeAttrs: Record<string, string>;
    readonly node: XmlNodeLike;
    attrs: Record<string, string>;
    css: Record<string, string>;
    constructor(xmlNode: XmlNodeLike, app: FakeApp);
    get tagName(): string;
    get xmlFragment(): XMLDocument;
    setAttr(k: string, v: string): void;
    getAttr(k: string): string;
    isVisible(): boolean;
    isEnabled(): boolean;
    isSelected(): boolean;
    getLocation(): {
        x: number;
        y: number;
    };
    getElementRect(): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    getSize(): {
        width: number;
        height: number;
    };
    click(): void;
    equals(other: FakeElement): boolean;
    hasPrompt(): boolean;
    getCss(prop: string): string | null;
    private parseCss;
}
//# sourceMappingURL=fake-element.d.ts.map