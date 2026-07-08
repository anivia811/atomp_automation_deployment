"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenCvAutoreleasePool = void 0;
class OpenCvAutoreleasePool {
    _items;
    constructor() {
        this._items = new Set();
    }
    add(...items) {
        for (const item of items) {
            this._items.add(item);
        }
        return items.length === 1 ? items[0] : items;
    }
    drain() {
        for (const item of this._items) {
            try {
                item.delete();
            }
            catch {
                // Ignore errors during cleanup
            }
        }
        this._items.clear();
    }
}
exports.OpenCvAutoreleasePool = OpenCvAutoreleasePool;
//# sourceMappingURL=autorelease-pool.js.map