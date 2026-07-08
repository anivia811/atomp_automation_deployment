/**
 * @fileoverview Bridges host-realm (child process) objects into Node's `vm.runInNewContext` without
 * leaking main-realm prototype metadata that untrusted script could use to obtain the real
 * `Function` constructor and escape the VM (RCE on the Appium host).
 *
 * ## Why this exists
 *
 * `vm` isolates *globals* and bytecode, but any **host object** you inject still carries the
 * **main V8 realm's** prototypes.
 *
 * ## Strategy (high level)
 *
 * 1. **Deep `Proxy`**: Every host object/function exposed to the script is wrapped. Property
 *    reads (`get`), call results (`apply` / `construct`), and—where allowed—descriptor reflection
 *    (`getOwnPropertyDescriptor`) funnel return values through `wrapIfNeeded`, which recursively
 *    wraps objects and functions so nested references never surface as raw host callables.
 *
 * 2. **Prototype-adjacent keys**: `constructor` and `__proto__` are not read from the target;
 *    the `get` trap returns a frozen null-prototype sentinel, `getPrototypeOf` always reports that
 *    sentinel (not the real prototype chain), `has` hides those keys, and `setPrototypeOf` is
 *    rejected—closing the usual `…constructor.constructor` chains.
 *
 * 3. **Identity**: `targetToProxy` is a `WeakMap` from each host object/function to its single
 *    proxy, so repeated reads (e.g. `driver.m === driver.m`) stay stable and cycles do not recurse
 *    forever. `proxyToTarget` reverses the mapping so `Reflect.get`/`apply` can unwrap `this` and
 *    pass the real host receiver to accessors and methods that expect it.
 *
 * 4. **Promises**: A `Proxy` around a native `Promise` breaks V8's internal `then` branding
 *    (WebdriverIO breaks). Host promises are therefore surfaced as a **null-prototype thenable**
 *    that forwards to the real promise and runs `wrapIfNeeded` on fulfilled/rejected values before
 *    VM continuations run. One thenable object per promise lives in `promiseToThenableHost`.
 *
 * 5. **Descriptors**: For **configurable** own properties only, `getOwnPropertyDescriptor` returns
 *    descriptors whose `value` / `get` / `set` are wrapped—so descriptor-based extraction of a
 *    method still yields a sandbox proxy. **Non-configurable** properties must return the real
 *    descriptor unchanged (ECMAScript Proxy invariants); those paths can still expose raw host
 *    callables until the script uses normal property access, which remains wrapped.
 *
 * 6. **`defineProperty`**: Incoming descriptors from the VM may reference our proxies; fields are
 *    unwrapped before `Reflect.defineProperty` so the host object receives real functions/objects.
 *
 * This is defense in depth: Node documents that `vm` is not a full security boundary. Treat
 * `--allow-insecure=…:execute_driver_script` as highly privileged regardless of this module.
 */
/**
 * Any host-realm callable (methods, timers, `console.log`, etc.) that may be wrapped
 * and passed into the VM alongside plain objects.
 */
type HostCallable = (...args: unknown[]) => unknown;
type HostTarget = object | HostCallable;
/**
 * Entry point: wrap a host object or function for use as a global in `vm.runInNewContext`.
 *
 * Delegates to {@link wrapDeep}; see the file-level overview for behavior and limitations.
 *
 * @typeParam T - Host object or function type (returned value is proxied but typed as `T`).
 * @param hostValue - Root binding injected into the VM (e.g. WebdriverIO `driver`, `console`).
 * @returns A proxy whose transitive property/call/descriptor surfaces hide host `Function` leaks.
 */
export declare function wrapHostBindingForVmContext<T extends HostTarget>(hostValue: T): T;
export {};
//# sourceMappingURL=vm-host-binding.d.ts.map