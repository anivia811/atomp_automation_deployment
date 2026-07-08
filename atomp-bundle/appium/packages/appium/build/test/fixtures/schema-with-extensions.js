"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * This fixture combines the base config schema and the fake-driver schema, as would happen in a real use case.
 */
const utils_1 = require("../../lib/utils");
const schema_1 = require("@appium/schema");
const { default: fakeDriverSchema } = require('@appium/fake-driver/build/lib/fake-driver-schema');
const schema = structuredClone(schema_1.AppiumConfigJsonSchema);
(0, utils_1.setPath)(schema, 'properties.driver.properties.fake', fakeDriverSchema);
exports.default = schema;
//# sourceMappingURL=schema-with-extensions.js.map