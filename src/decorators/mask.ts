import { MaskOptions } from '../utils';

// Polyfill Symbol.metadata globally if it doesn't exist
if (typeof (Symbol as any).metadata === 'undefined') {
  (Symbol as any).metadata = Symbol.for('Symbol.metadata');
}

const metadataSymbol = (Symbol as any).metadata;

export const MASK_METADATA_KEY = Symbol.for('MASK_METADATA');

/**
 * Property decorator using TC39 Stage 3 syntax.
 * Stores masking options in the class metadata under MASK_METADATA_KEY.
 */
export function Mask(options?: MaskOptions) {
  return function (_value: undefined, context: ClassFieldDecoratorContext) {
    const metadata = context.metadata;
    if (metadata) {
      let maskMeta = metadata[MASK_METADATA_KEY] as Record<string | symbol, MaskOptions> | undefined;
      if (!maskMeta) {
        maskMeta = {};
        metadata[MASK_METADATA_KEY] = maskMeta;
      }
      maskMeta[context.name] = options || { autoDetect: true };
    }
  };
}

/**
 * Extracts mask metadata from a target class/constructor or object instance.
 */
export function getMaskMetadata(target: any): Record<string | symbol, MaskOptions> | null {
  if (!target) return null;
  const constructor = typeof target === 'function' ? target : target.constructor;
  if (!constructor) return null;
  const metadata = (constructor as any)[metadataSymbol];
  if (metadata && metadata[MASK_METADATA_KEY]) {
    return metadata[MASK_METADATA_KEY];
  }
  return null;
}
