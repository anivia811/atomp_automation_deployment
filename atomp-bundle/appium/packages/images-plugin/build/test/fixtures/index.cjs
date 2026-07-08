"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TiNY_PNG_BUF = exports.APPSTORE_IMG_PATH = exports.TEST_IMG_2_PART_B64 = exports.TEST_IMG_2_B64 = exports.TEST_IMG_1_B64 = exports.TINY_PNG_DIMS = exports.TINY_PNG = void 0;
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const TINY_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQwIDc5LjE2MDQ1MSwgMjAxNy8wNS8wNi0wMTowODoyMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTggKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6N0NDMDM4MDM4N0U2MTFFOEEzMzhGMTRFNUUwNzIwNUIiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6N0NDMDM4MDQ4N0U2MTFFOEEzMzhGMTRFNUUwNzIwNUIiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo3Q0MwMzgwMTg3RTYxMUU4QTMzOEYxNEU1RTA3MjA1QiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo3Q0MwMzgwMjg3RTYxMUU4QTMzOEYxNEU1RTA3MjA1QiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PpdvJjQAAAAlSURBVHjaJInBEQAACIKw/Xe2Ul5wYBtwmJqkk4+zfvUQVoABAEg0EfrZwc0hAAAAAElFTkSuQmCC';
exports.TINY_PNG = TINY_PNG;
const TiNY_PNG_BUF = Buffer.from(TINY_PNG, 'base64');
exports.TiNY_PNG_BUF = TiNY_PNG_BUF;
const TINY_PNG_DIMS = [4, 4];
exports.TINY_PNG_DIMS = TINY_PNG_DIMS;
const TEST_IMG_1_PATH = node_path_1.default.resolve(__dirname, 'img1.png');
const TEST_IMG_2_PATH = node_path_1.default.resolve(__dirname, 'img2.png');
const TEST_IMG_2_PART_PATH = node_path_1.default.resolve(__dirname, 'img2_part.png');
const APPSTORE_IMG_PATH = node_path_1.default.resolve(__dirname, 'appstore.png');
exports.APPSTORE_IMG_PATH = APPSTORE_IMG_PATH;
const TEST_IMG_1_B64 = node_fs_1.default.readFileSync(TEST_IMG_1_PATH).toString('base64');
exports.TEST_IMG_1_B64 = TEST_IMG_1_B64;
const TEST_IMG_2_B64 = node_fs_1.default.readFileSync(TEST_IMG_2_PATH).toString('base64');
exports.TEST_IMG_2_B64 = TEST_IMG_2_B64;
const TEST_IMG_2_PART_B64 = node_fs_1.default.readFileSync(TEST_IMG_2_PART_PATH).toString('base64');
exports.TEST_IMG_2_PART_B64 = TEST_IMG_2_PART_B64;
//# sourceMappingURL=index.cjs.map