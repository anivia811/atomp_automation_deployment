"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runQuery = runQuery;
exports.transformQuery = transformQuery;
exports.getNodeAttrVal = getNodeAttrVal;
const xpath_1 = require("xpath");
const xmldom_1 = require("@xmldom/xmldom");
/**
 * Runs an XPath query against an XML string.
 * @param query XPath query.
 * @param xmlStr XML source.
 */
function runQuery(query, xmlStr) {
    const dom = new xmldom_1.DOMParser().parseFromString(xmlStr, xmldom_1.MIME_TYPE.XML_TEXT);
    // @ts-expect-error Missing Node properties are not needed.
    // https://github.com/xmldom/xmldom/issues/724
    const nodes = (0, xpath_1.select)(query, dom);
    return nodes;
}
/**
 * Transforms an XPath query to work with the original platform-specific XML
 *
 * @param query - The XPath query to transform
 * @param xmlStr - The transformed XML string
 * @param multiple - Whether to return multiple matches
 * @returns The transformed query string or null if no matches found
 */
function transformQuery(query, xmlStr, multiple) {
    const nodes = runQuery(query, xmlStr);
    if (!Array.isArray(nodes)) {
        return null;
    }
    const newQueries = nodes.map((node) => {
        const indexPath = getNodeAttrVal(node, 'indexPath');
        // at this point indexPath will look like /0/0/1/1/0/1/0/2
        const newQuery = indexPath
            .substring(1) // remove leading / so we can split
            .split('/') // split into indexes
            .map((indexStr) => {
            // map to xpath node indexes (1-based)
            const xpathIndex = parseInt(indexStr, 10) + 1;
            return `*[${xpathIndex}]`;
        })
            .join('/'); // reapply /
        // now to make this a valid xpath from the root, prepend the / we removed earlier
        return `/${newQuery}`;
    });
    if (newQueries.length === 0) {
        return null;
    }
    return multiple ? newQueries.join(' | ') : newQueries[0];
}
/**
 * Gets the value of a node attribute
 *
 * @param node - The XML node
 * @param attr - The attribute name
 * @returns The attribute value
 * @throws {Error} If the attribute doesn't exist
 */
function getNodeAttrVal(node, attr) {
    const attrObjs = Object.values(node.attributes || {}).filter((obj) => obj.name === attr);
    if (!attrObjs.length) {
        throw new Error(`Tried to retrieve a node attribute '${attr}' but the node didn't have it`);
    }
    return attrObjs[0].value;
}
//# sourceMappingURL=xpath.js.map