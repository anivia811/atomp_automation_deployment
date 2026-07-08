import * as xpath from 'xpath';
import { FakeElement, type XmlNodeLike } from './fake-element';
import type { ActionSequence, Location, Orientation } from '@appium/types';
import type { Document as XMLDocument } from '@xmldom/xmldom';
export interface FakeWebView {
    node: XmlNodeLike;
}
/** In-memory app model: XML DOM, webviews, alerts, geo, orientation, actions log. */
export declare class FakeApp {
    dom: XMLDocument | null;
    activeDom: XMLDocument | null;
    activeWebview: FakeWebView | null;
    activeFrame: XMLDocument | null;
    activeAlert: FakeElement | null;
    lat: number;
    long: number;
    rawXml: string;
    currentOrientation: Orientation;
    actionLog: ActionSequence[][];
    private _width;
    private _height;
    constructor();
    get title(): string;
    get currentGeoLocation(): Location;
    get orientation(): Orientation;
    get width(): number;
    get height(): number;
    set orientation(o: Orientation);
    loadApp(appPath: string): Promise<void>;
    getWebviews(): FakeWebView[];
    activateWebview(wv: FakeWebView): void;
    deactivateWebview(): void;
    activateFrame(frame: XMLDocument): void;
    deactivateFrame(): void;
    xpathQuery(sel: string, ctx?: XMLDocument | null): xpath.SelectedValue;
    idQuery(id: string, ctx?: XMLDocument | null): xpath.SelectedValue;
    classQuery(className: string, ctx?: XMLDocument | null): xpath.SelectedValue;
    cssQuery(css: string, ctx?: XMLDocument | null): xpath.SelectedValue;
    hasAlert(): boolean;
    setAlertText(text: string): void;
    showAlert(alertId: string): void;
    /** Alert text from prompt attr or node text attr (e.g. <alert text="Fake Alert">). */
    alertText(): string;
    handleAlert(): void;
    getScreenshot(): string;
    private setDims;
}
export declare class FakeWebViewImpl implements FakeWebView {
    readonly node: XmlNodeLike;
    constructor(node: XmlNodeLike);
}
//# sourceMappingURL=fake-app.d.ts.map