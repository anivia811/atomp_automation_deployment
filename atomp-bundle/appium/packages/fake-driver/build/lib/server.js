"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const logger_1 = require("./logger");
const driver_1 = require("appium/driver");
const driver_2 = require("./driver");
/** Start HTTP server with FakeDriver and default WebDriver routes. */
async function startServer(port, hostname) {
    const d = new driver_2.FakeDriver();
    const server = await (0, driver_1.server)({
        routeConfiguringFunction: (0, driver_1.routeConfiguringFunction)(d),
        port,
        hostname,
    });
    logger_1.log.info(`FakeDriver server listening on http://${hostname}:${port}`);
    return server;
}
//# sourceMappingURL=server.js.map