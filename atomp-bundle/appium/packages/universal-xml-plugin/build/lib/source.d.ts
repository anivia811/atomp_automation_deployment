import type { NodesAndAttributes, TransformSourceXmlOptions, TransformNodeOptions } from './types';
export declare const ATTR_PREFIX = "@_";
export declare const IDX_PATH_PREFIX = "@_indexPath";
export declare const IDX_PREFIX = "@_index";
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
export declare function transformSourceXml(xmlStr: string, platform: string, { metadata, addIndexPath }?: TransformSourceXmlOptions): Promise<{
    xml: string;
    unknowns: NodesAndAttributes;
}>;
/**
 * Gets the universal node name for a platform-specific node name
 *
 * @param nodeName - The platform-specific node name
 * @param platform - The platform name
 * @returns The universal node name or null if not found
 */
export declare function getUniversalNodeName(nodeName: string, platform: string): string | null;
/**
 * Gets the universal attribute name for a platform-specific attribute name
 *
 * @param attrName - The platform-specific attribute name
 * @param platform - The platform name
 * @returns The universal attribute name or null if not found
 */
export declare function getUniversalAttrName(attrName: string, platform: string): string | null;
/**
 * Transforms a node object recursively
 *
 * @param nodeObj - The node object to transform
 * @param platform - The platform name
 * @param opts - Transformation options
 * @returns Object containing unknown nodes and attributes
 */
export declare function transformNode(nodeObj: any, platform: string, { metadata, addIndexPath, parentPath }: TransformNodeOptions): NodesAndAttributes;
/**
 * Transforms child nodes of a node object
 *
 * @param nodeObj - The node object containing child nodes
 * @param childNodeNames - Array of child node names
 * @param platform - The platform name
 * @param opts - Transformation options
 * @returns Object containing unknown nodes and attributes
 */
export declare function transformChildNodes(nodeObj: any, childNodeNames: string[], platform: string, { metadata, addIndexPath, parentPath }: TransformNodeOptions): NodesAndAttributes;
/**
 * Transforms attributes of a node object
 *
 * @param nodeObj - The node object containing attributes
 * @param attrs - Array of attribute keys
 * @param platform - The platform name
 * @returns Array of unknown attribute names
 */
export declare function transformAttrs(nodeObj: any, attrs: string[], platform: string): string[];
//# sourceMappingURL=source.d.ts.map