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
exports.IDX_PREFIX = exports.IDX_PATH_PREFIX = exports.ATTR_PREFIX = void 0;
exports.transformSourceXml = transformSourceXml;
exports.getUniversalNodeName = getUniversalNodeName;
exports.getUniversalAttrName = getUniversalAttrName;
exports.transformNode = transformNode;
exports.transformChildNodes = transformChildNodes;
exports.transformAttrs = transformAttrs;
const support_1 = require("@appium/support");
const fast_xml_parser_1 = require("fast-xml-parser");
const node_map_1 = __importDefault(require("./node-map"));
const attr_map_1 = require("./attr-map");
const TRANSFORMS = __importStar(require("./transformers"));
exports.ATTR_PREFIX = '@_';
exports.IDX_PATH_PREFIX = `${exports.ATTR_PREFIX}indexPath`;
exports.IDX_PREFIX = `${exports.ATTR_PREFIX}index`;
const isAttr = (k) => k.startsWith(exports.ATTR_PREFIX);
const isNode = (k) => !isAttr(k);
/**
 * Transforms source XML to universal format
 *
 * @param xmlStr - The XML string to transform
 * @param platform - The platform name ('ios' or 'android')
 * @param opts - Transformation options
 * @param opts.metadata - Optional metadata object
 * @param opts.addIndexPath - Whether to add index path attributes
 * @returns Promise resolving to transformed XML and unknown nodes/attributes
 */
async function transformSourceXml(xmlStr, platform, { metadata = {}, addIndexPath = false } = {}) {
    // first thing we want to do is modify the ios source root node, because it doesn't include the
    // necessary index attribute, so we add it if it's not there
    xmlStr = xmlStr.replace('<AppiumAUT>', '<AppiumAUT index="0">');
    const xmlObj = singletonXmlParser().parse(xmlStr);
    const unknowns = transformNode(xmlObj, platform, {
        metadata,
        addIndexPath,
        parentPath: '',
    });
    let transformedXml = singletonXmlBuilder().build(xmlObj).trim();
    transformedXml = `<?xml version="1.0" encoding="UTF-8"?>\n${transformedXml}`;
    return { xml: transformedXml, unknowns };
}
/**
 * Gets the universal node name for a platform-specific node name
 *
 * @param nodeName - The platform-specific node name
 * @param platform - The platform name
 * @returns The universal node name or null if not found
 */
function getUniversalNodeName(nodeName, platform) {
    return getUniversalName(node_map_1.default, nodeName, platform);
}
/**
 * Gets the universal attribute name for a platform-specific attribute name
 *
 * @param attrName - The platform-specific attribute name
 * @param platform - The platform name
 * @returns The universal attribute name or null if not found
 */
function getUniversalAttrName(attrName, platform) {
    return getUniversalName(attr_map_1.ATTR_MAP, attrName, platform);
}
/**
 * Transforms a node object recursively
 *
 * @param nodeObj - The node object to transform
 * @param platform - The platform name
 * @param opts - Transformation options
 * @returns Object containing unknown nodes and attributes
 */
function transformNode(nodeObj, platform, { metadata, addIndexPath, parentPath }) {
    const unknownNodes = [];
    const unknownAttrs = [];
    if (support_1.util.isPlainObject(nodeObj)) {
        const keys = Object.keys(nodeObj);
        const childNodeNames = keys.filter(isNode);
        const attrs = keys.filter(isAttr);
        let thisIndexPath = parentPath || '';
        if (attrs.length && addIndexPath) {
            if (!attrs.includes(exports.IDX_PREFIX)) {
                throw new Error(`Index path is required but node found with no 'index' attribute`);
            }
            thisIndexPath = `${parentPath || ''}/${nodeObj[exports.IDX_PREFIX]}`;
            nodeObj[exports.IDX_PATH_PREFIX] = thisIndexPath;
        }
        const transformFn = TRANSFORMS[platform];
        if (transformFn) {
            transformFn(nodeObj, metadata || {});
        }
        unknownAttrs.push(...transformAttrs(nodeObj, attrs, platform));
        const unknowns = transformChildNodes(nodeObj, childNodeNames, platform, {
            metadata,
            addIndexPath,
            parentPath: thisIndexPath,
        });
        unknownAttrs.push(...unknowns.attrs);
        unknownNodes.push(...unknowns.nodes);
    }
    else if (Array.isArray(nodeObj)) {
        for (const childObj of nodeObj) {
            const { nodes, attrs } = transformNode(childObj, platform, {
                metadata,
                addIndexPath,
                parentPath: parentPath || '',
            });
            unknownNodes.push(...nodes);
            unknownAttrs.push(...attrs);
        }
    }
    return {
        nodes: support_1.util.uniq(unknownNodes),
        attrs: support_1.util.uniq(unknownAttrs),
    };
}
/**
 * Transforms child nodes of a node object
 *
 * @param nodeObj - The node object containing child nodes
 * @param childNodeNames - Array of child node names
 * @param platform - The platform name
 * @param opts - Transformation options
 * @returns Object containing unknown nodes and attributes
 */
function transformChildNodes(nodeObj, childNodeNames, platform, { metadata, addIndexPath, parentPath }) {
    const unknownNodes = [];
    const unknownAttrs = [];
    for (const nodeName of childNodeNames) {
        // before modifying the name of this child node, recurse down and modify the subtree
        const { nodes, attrs } = transformNode(nodeObj[nodeName], platform, {
            metadata,
            addIndexPath,
            parentPath: parentPath || '',
        });
        unknownNodes.push(...nodes);
        unknownAttrs.push(...attrs);
        // now translate the node name and replace the subtree with this node
        const universalName = getUniversalNodeName(nodeName, platform);
        if (universalName === null) {
            unknownNodes.push(nodeName);
            continue;
        }
        // since multiple child node names could map to the same new transformed node name, we can't
        // simply assign nodeObj[universalName] = nodeObj[nodeName]; we need to be sensitive to the
        // situation where the end result is an array of children having the same node name
        if (nodeObj[universalName]) {
            // if we already have a node with the universal name, that means we are mapping a second
            // original node name to the same universal node name, so we just push all its children into
            // the list
            if (Array.isArray(nodeObj[universalName])) {
                if (Array.isArray(nodeObj[nodeName])) {
                    nodeObj[universalName].push(...nodeObj[nodeName]);
                }
                else {
                    nodeObj[universalName].push(nodeObj[nodeName]);
                }
            }
            else {
                nodeObj[universalName] = [nodeObj[universalName]];
                if (Array.isArray(nodeObj[nodeName])) {
                    nodeObj[universalName].push(...nodeObj[nodeName]);
                }
                else {
                    nodeObj[universalName].push(nodeObj[nodeName]);
                }
            }
        }
        else {
            nodeObj[universalName] = nodeObj[nodeName];
        }
        delete nodeObj[nodeName];
    }
    return { nodes: unknownNodes, attrs: unknownAttrs };
}
/**
 * Transforms attributes of a node object
 *
 * @param nodeObj - The node object containing attributes
 * @param attrs - Array of attribute keys
 * @param platform - The platform name
 * @returns Array of unknown attribute names
 */
function transformAttrs(nodeObj, attrs, platform) {
    const unknownAttrs = [];
    for (const attr of attrs) {
        const cleanAttr = attr.substring(2);
        if (attr_map_1.REMOVE_ATTRS.includes(cleanAttr)) {
            delete nodeObj[attr];
            continue;
        }
        const universalAttr = getUniversalAttrName(cleanAttr, platform);
        if (universalAttr === null) {
            unknownAttrs.push(cleanAttr);
            continue;
        }
        const newAttr = `${exports.ATTR_PREFIX}${universalAttr}`;
        if (newAttr !== attr) {
            nodeObj[newAttr] = nodeObj[attr];
            delete nodeObj[attr];
        }
    }
    return unknownAttrs;
}
/**
 * Gets the universal name for a platform-specific name from a name map
 *
 * @param nameMap - The name mapping object
 * @param name - The platform-specific name
 * @param platform - The platform name
 * @returns The universal name or null if not found
 */
function getUniversalName(nameMap, name, platform) {
    for (const translatedName of Object.keys(nameMap)) {
        const sourceNodes = nameMap[translatedName]?.[platform];
        if (Array.isArray(sourceNodes) && sourceNodes.includes(name)) {
            return translatedName;
        }
        if (sourceNodes === name) {
            return translatedName;
        }
    }
    return null;
}
const singletonXmlBuilder = support_1.util.memoize(function makeXmlBuilder() {
    return new fast_xml_parser_1.XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: exports.ATTR_PREFIX,
        suppressBooleanAttributes: false,
        format: true,
    });
});
const singletonXmlParser = support_1.util.memoize(function makeXmlParser() {
    return new fast_xml_parser_1.XMLParser({
        ignoreAttributes: false,
        ignoreDeclaration: true,
        attributeNamePrefix: exports.ATTR_PREFIX,
        isArray: (name, jPath, isLeafNode, isAttribute) => !isAttribute,
    });
});
//# sourceMappingURL=source.js.map