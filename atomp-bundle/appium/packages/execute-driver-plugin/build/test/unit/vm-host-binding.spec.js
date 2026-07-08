"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_vm_1 = __importDefault(require("node:vm"));
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const vm_host_binding_1 = require("../../lib/vm-host-binding");
(0, chai_1.use)(chai_as_promised_1.default);
describe('wrapHostBindingForVmContext', function () {
    const hostishDriver = Object.create(Object.prototype);
    hostishDriver.sessionId = 'fake';
    it('should still expose ordinary properties on objects to the VM', function () {
        const d = (0, vm_host_binding_1.wrapHostBindingForVmContext)(hostishDriver);
        const sessionId = node_vm_1.default.runInNewContext(`d.sessionId`, { d }, { timeout: 500 });
        (0, chai_1.expect)(sessionId).to.equal('fake');
    });
    it('should block constructor chaining on objects to the host Function', function () {
        const d = (0, vm_host_binding_1.wrapHostBindingForVmContext)(hostishDriver);
        (0, chai_1.expect)(() => node_vm_1.default.runInNewContext(`const func = d.constructor.constructor; func('return typeof process')()`, { d }, { timeout: 500 })).to.throw();
    });
    it('should block Object.getPrototypeOf constructor chaining on objects', function () {
        const d = (0, vm_host_binding_1.wrapHostBindingForVmContext)(hostishDriver);
        (0, chai_1.expect)(() => node_vm_1.default.runInNewContext(`const p = Object.getPrototypeOf(d);
         const func = p.constructor.constructor;
         func('return typeof process')()`, { d }, { timeout: 500 })).to.throw();
    });
    it('should block __proto__ constructor chaining on objects', function () {
        const d = (0, vm_host_binding_1.wrapHostBindingForVmContext)(hostishDriver);
        (0, chai_1.expect)(() => node_vm_1.default.runInNewContext(`const p = d.__proto__;
         const func = p.constructor.constructor;
         func('return typeof process')()`, { d }, { timeout: 500 })).to.throw();
    });
    it('should block constructor chaining on injected timers', function () {
        const st = (0, vm_host_binding_1.wrapHostBindingForVmContext)(setTimeout);
        const ct = (0, vm_host_binding_1.wrapHostBindingForVmContext)(clearTimeout);
        (0, chai_1.expect)(() => node_vm_1.default.runInNewContext(`const func = setTimeout.constructor.constructor;
         func('return typeof process')()`, { setTimeout: st, clearTimeout: ct }, { timeout: 500 })).to.throw();
    });
    it('should still allow setTimeout to schedule callbacks', async function () {
        const st = (0, vm_host_binding_1.wrapHostBindingForVmContext)(setTimeout);
        const ct = (0, vm_host_binding_1.wrapHostBindingForVmContext)(clearTimeout);
        const waited = node_vm_1.default.runInNewContext(`new Promise((resolve) => setTimeout(() => resolve(true), 10))`, { setTimeout: st, clearTimeout: ct }, { timeout: 500 });
        (0, chai_1.expect)(await waited).to.equal(true);
    });
    it('should block constructor chaining on console method functions', function () {
        const logs = [];
        const consoleFns = {
            log: (0, vm_host_binding_1.wrapHostBindingForVmContext)((...m) => logs.push(...m)),
        };
        const sandboxConsole = (0, vm_host_binding_1.wrapHostBindingForVmContext)(consoleFns);
        (0, chai_1.expect)(() => node_vm_1.default.runInNewContext(`const func = console.log.constructor.constructor;
         func('return typeof process')()`, { console: sandboxConsole }, { timeout: 500 })).to.throw();
    });
    it('should block constructor chaining on the console aggregate object', function () {
        const consoleFns = (0, vm_host_binding_1.wrapHostBindingForVmContext)({
            log: (0, vm_host_binding_1.wrapHostBindingForVmContext)(() => { }),
        });
        (0, chai_1.expect)(() => node_vm_1.default.runInNewContext(`const func = console.constructor.constructor;
         func('return typeof process')()`, { console: consoleFns }, { timeout: 500 })).to.throw();
    });
    it('should block constructor chaining on nested methods (e.g. driver.deleteSession)', function () {
        const host = Object.create(Object.prototype);
        host.deleteSession = () => { };
        const d = (0, vm_host_binding_1.wrapHostBindingForVmContext)(host);
        (0, chai_1.expect)(() => node_vm_1.default.runInNewContext(`const m = d.deleteSession;
         const func = m.constructor.constructor;
         func('return typeof process')()`, { d }, { timeout: 500 })).to.throw();
    });
    it('should block host Function escape when reading a configurable function-valued property (someMethod)', function () {
        const host = Object.create(null);
        function someMethod() {
            return 1;
        }
        Object.defineProperty(host, 'someMethod', {
            value: someMethod,
            writable: true,
            enumerable: true,
            configurable: true,
        });
        const d = (0, vm_host_binding_1.wrapHostBindingForVmContext)(host);
        (0, chai_1.expect)(() => node_vm_1.default.runInNewContext(`const m = d.someMethod;
         const func = m.constructor.constructor;
         func('return typeof process')();`, { d }, { timeout: 500 })).to.throw();
    });
    it('should block constructor chaining on .bind() results', function () {
        const host = Object.create(Object.prototype);
        host.fn = (x) => x;
        const d = (0, vm_host_binding_1.wrapHostBindingForVmContext)(host);
        (0, chai_1.expect)(() => node_vm_1.default.runInNewContext(`const b = d.fn.bind(d);
         const func = b.constructor.constructor;
         func('return typeof process')()`, { d }, { timeout: 500 })).to.throw();
    });
    it('should wrap descriptor values from getOwnPropertyDescriptor', function () {
        const host = Object.create(null);
        Object.defineProperty(host, 'm', {
            value: () => { },
            writable: true,
            enumerable: true,
            configurable: true,
        });
        const d = (0, vm_host_binding_1.wrapHostBindingForVmContext)(host);
        (0, chai_1.expect)(() => node_vm_1.default.runInNewContext(`const desc = Object.getOwnPropertyDescriptor(d, 'm');
         if (!desc || !('value' in desc)) {
           throw new Error('expected data descriptor with value from getOwnPropertyDescriptor');
         }
         const func = desc.value.constructor.constructor;
         func('return typeof process')()`, { d }, { timeout: 500 })).to.throw();
    });
    it('should preserve identity for repeated reads of the same nested method', function () {
        const host = Object.create(Object.prototype);
        host.m = () => { };
        const d = (0, vm_host_binding_1.wrapHostBindingForVmContext)(host);
        const same = node_vm_1.default.runInNewContext(`d.m === d.m`, { d }, { timeout: 500 });
        (0, chai_1.expect)(same).to.equal(true);
    });
    it('should unwrap proxied arguments before invoking host functions', function () {
        const original = { id: 'host-object' };
        const host = {
            provide() {
                return original;
            },
            consume(arg) {
                return arg === original;
            },
        };
        const d = (0, vm_host_binding_1.wrapHostBindingForVmContext)(host);
        const roundTripsAsOriginal = node_vm_1.default.runInNewContext(`const value = d.provide();
       d.consume(value);`, { d }, { timeout: 500 });
        (0, chai_1.expect)(roundTripsAsOriginal).to.equal(true);
    });
    it('should unwrap proxied arguments before invoking host constructors via new', function () {
        const original = { id: 'ctor-arg' };
        const host = {
            Box: class Box {
                arg;
                constructor(arg) {
                    this.arg = arg;
                }
            },
            provide() {
                return original;
            },
            isOriginal(value) {
                return value === original;
            },
        };
        const d = (0, vm_host_binding_1.wrapHostBindingForVmContext)(host);
        const ctorArgRoundTripsAsOriginal = node_vm_1.default.runInNewContext(`const value = d.provide();
       const box = new d.Box(value);
       d.isOriginal(box.arg);`, { d }, { timeout: 500 });
        (0, chai_1.expect)(ctorArgRoundTripsAsOriginal).to.equal(true);
    });
    it('should not double-wrap function proxies', function () {
        const fn = function hostFn() {
            return 1;
        };
        const wrapped = (0, vm_host_binding_1.wrapHostBindingForVmContext)(fn);
        const wrappedAgain = (0, vm_host_binding_1.wrapHostBindingForVmContext)(wrapped);
        (0, chai_1.expect)(wrappedAgain).to.equal(wrapped);
    });
    it('should still await Promise results from wrapped methods', async function () {
        const host = Object.create(Object.prototype);
        host.p = () => Promise.resolve(7);
        const d = (0, vm_host_binding_1.wrapHostBindingForVmContext)(host);
        const v = node_vm_1.default.runInNewContext(`(async () => await d.p())()`, { d }, { timeout: 500 });
        (0, chai_1.expect)(await v).to.equal(7);
    });
    it('should block constructor chaining on values fulfilled from wrapped Promises', async function () {
        const host = Object.create(Object.prototype);
        host.p = () => Promise.resolve({ x: 1 });
        const d = (0, vm_host_binding_1.wrapHostBindingForVmContext)(host);
        await (0, chai_1.expect)(node_vm_1.default.runInNewContext(`(async () => {
          const v = await d.p();
          const func = v.constructor.constructor;
          func('return typeof process')();
        })()`, { d }, { timeout: 500 })).to.eventually.be.rejected;
    });
});
//# sourceMappingURL=vm-host-binding.spec.js.map