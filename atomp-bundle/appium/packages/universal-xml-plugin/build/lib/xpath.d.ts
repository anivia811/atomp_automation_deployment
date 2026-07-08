/**
 * Runs an XPath query against an XML string.
 * @param query XPath query.
 * @param xmlStr XML source.
 */
export declare function runQuery(query: string, xmlStr: string): any[];
/**
 * Transforms an XPath query to work with the original platform-specific XML
 *
 * @param query - The XPath query to transform
 * @param xmlStr - The transformed XML string
 * @param multiple - Whether to return multiple matches
 * @returns The transformed query string or null if no matches found
 */
export declare function transformQuery(query: string, xmlStr: string, multiple: boolean): string | null;
/**
 * Gets the value of a node attribute
 *
 * @param node - The XML node
 * @param attr - The attribute name
 * @returns The attribute value
 * @throws {Error} If the attribute doesn't exist
 */
export declare function getNodeAttrVal(node: any, attr: string): string;
//# sourceMappingURL=xpath.d.ts.map