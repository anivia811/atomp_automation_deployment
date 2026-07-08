import type { TransformMetadata } from './types';
/**
 * No-op transformer for iOS source XML.
 * @param nodeObj Node object to transform.
 */
export declare function ios(nodeObj: any): void;
/**
 * Normalizes Android-specific attributes in source XML.
 * @param nodeObj Node object to transform.
 * @param metadata Transformation metadata.
 */
export declare function android(nodeObj: any, metadata: TransformMetadata): void;
//# sourceMappingURL=transformers.d.ts.map