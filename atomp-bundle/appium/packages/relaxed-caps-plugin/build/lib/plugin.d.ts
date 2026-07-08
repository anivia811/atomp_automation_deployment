import { BasePlugin } from 'appium/plugin';
import type { W3CCapsLike } from './types';
export declare class RelaxedCapsPlugin extends BasePlugin {
    createSession(next: () => Promise<unknown>, driver: {
        createSession: (...args: unknown[]) => Promise<unknown>;
    }, caps1: W3CCapsLike | null, caps2?: W3CCapsLike | null, caps3?: W3CCapsLike | null, ...restArgs: unknown[]): Promise<unknown>;
    private fixCapsIfW3C;
    private isW3cCaps;
    private addVendorPrefix;
}
//# sourceMappingURL=plugin.d.ts.map