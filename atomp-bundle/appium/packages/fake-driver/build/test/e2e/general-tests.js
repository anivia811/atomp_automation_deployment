"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalTests = generalTests;
const chai_1 = __importStar(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const helpers_1 = require("../helpers");
chai_1.default.use(chai_as_promised_1.default);
function generalTests() {
    describe('generic actions', function () {
        let driver;
        before(async function () {
            driver = await (0, helpers_1.initSession)(helpers_1.W3C_PREFIXED_CAPS);
        });
        after(async function () {
            return await (0, helpers_1.deleteSession)(driver);
        });
        it.skip('should set geolocation', async function () {
            // TODO unquarantine when WD fixes what it sends the server
            await driver.setGeoLocation({ latitude: -30, longitude: 30 });
        });
        it('should get geolocation', async function () {
            const geo = await driver.getGeoLocation();
            (0, chai_1.expect)(geo.latitude).to.exist;
            (0, chai_1.expect)(geo.longitude).to.exist;
        });
        it('should get app source', async function () {
            const source = await driver.getPageSource();
            (0, chai_1.expect)(source).to.contain('<MockNavBar id="nav"');
        });
        // TODO do we want to test driver.pageIndex? probably not
        it('should get the orientation', async function () {
            (0, chai_1.expect)(await driver.getOrientation()).to.equal('PORTRAIT');
        });
        it('should set the orientation to something valid', async function () {
            await driver.setOrientation('LANDSCAPE');
            (0, chai_1.expect)(await driver.getOrientation()).to.equal('LANDSCAPE');
        });
        it('should not set the orientation to something invalid', async function () {
            await (0, chai_1.expect)(driver.setOrientation('INSIDEOUT')).to.be.rejectedWith(/Orientation must be/);
        });
        it('should get a screenshot', async function () {
            const screenshot = await driver.takeScreenshot();
            (0, chai_1.expect)(screenshot).to.match(/^iVBOR/);
            (0, chai_1.expect)(screenshot).to.have.length.above(4000);
        });
        it('should get screen height/width', async function () {
            const { height, width } = await driver.getWindowSize();
            (0, chai_1.expect)(height).to.be.above(100);
            (0, chai_1.expect)(width).to.be.above(100);
        });
        it('should set implicit wait timeout', async function () {
            await driver.setTimeout({ implicit: 1000 });
        });
        it('should not set invalid implicit wait timeout', async function () {
            await (0, chai_1.expect)(driver.setTimeout({ implicit: 'foo' })).to.be.rejectedWith(/values are not valid/);
        });
        // skip these until basedriver supports these timeouts
        it.skip('should set async script timeout', async function () {
            await driver.setTimeout({ script: 1000 });
        });
        it.skip('should not set invalid async script timeout', async function () {
            await (0, chai_1.expect)(driver.setTimeout({ script: 'foo' })).to.be.rejectedWith(/values are not valid/);
        });
        it.skip('should set page load timeout', async function () {
            await driver.setTimeout({ pageLoad: 1000 });
        });
        it.skip('should not set page load script timeout', async function () {
            await (0, chai_1.expect)(driver.setTimeout({ pageLoad: 'foo' })).to.be.rejectedWith(/values are not valid/);
        });
        it('should allow performing actions that do nothing but save them', async function () {
            const actions = [
                {
                    type: 'pointer',
                    id: 'finger1',
                    parameters: {
                        pointerType: 'touch',
                    },
                    actions: [
                        {
                            type: 'pointerDown',
                            button: 0,
                        },
                        {
                            type: 'pointerUp',
                            button: 0,
                        },
                    ],
                },
            ];
            await driver.performActions(actions);
            const [res] = (await driver.getLogs('actions'));
            (0, chai_1.expect)(res[0].type).to.eql('pointer');
            (0, chai_1.expect)(res[0].actions).to.have.length(2);
        });
        it('should get and set a fake thing via execute overloads', async function () {
            let thing = await driver.executeScript('fake: getThing', []);
            (0, chai_1.expect)(thing).to.not.exist;
            await driver.executeScript('fake: setThing', [{ thing: 1234 }]);
            thing = await driver.executeScript('fake: getThing', []);
            (0, chai_1.expect)(thing).to.eql(1234);
        });
        it('should add 2 numbers via execute overloads', async function () {
            await (0, chai_1.expect)(driver.executeScript('fake: addition', [{ num1: 2, num2: 3 }])).to.eventually.eql(5);
            await (0, chai_1.expect)(driver.executeScript('fake: addition', [{ num1: 2, num2: 3, num3: 4 }])).to.eventually.eql(9);
        });
        it('should throw not implemented if an execute overload isnt supported', async function () {
            await (0, chai_1.expect)(driver.executeScript('fake: blarg', [])).to.be.rejectedWith(/Unsupported execute method/);
        });
        it('should throw an error if a required overload param is missing', async function () {
            await (0, chai_1.expect)(driver.executeScript('fake: addition', [{ num3: 4 }])).to.be.rejectedWith(/required parameters are missing/);
        });
        it('should throw an error if sending in wrong types of params', async function () {
            await (0, chai_1.expect)(driver.executeScript('fake: addition', [4, 5])).to.be.rejectedWith(/correct format of arg/);
            await (0, chai_1.expect)(driver.executeScript('fake: addition', [4])).to.be.rejectedWith(/not receive an appropriate execute/);
            await (0, chai_1.expect)(driver.executeScript('fake: addition', [{ num1: 2 }, { extra: 'bad' }])).to.be.rejectedWith(/correct format of arg/);
        });
    });
}
//# sourceMappingURL=general-tests.js.map