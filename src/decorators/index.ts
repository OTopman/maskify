import 'reflect-metadata';
import { MaskOptions } from '../utils';

export const MASK_METADATA_KEY = Symbol.for('MASK_METADATA');

/**
 * Decorator to mark a property for masking.
 * @example
 * class User {
 * @Mask({ type: 'email' })
 * email: string;
 * }
 */
export function Mask(options?: MaskOptions) {
  return function (target: Object, propertyKey: string | symbol) {
    const existing = Reflect.getMetadata(MASK_METADATA_KEY, target) || {};
    existing[propertyKey] = options || { autoDetect: true };
    Reflect.defineMetadata(MASK_METADATA_KEY, existing, target);
  };
}
