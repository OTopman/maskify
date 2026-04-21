import 'reflect-metadata';
import { MaskOptions } from '../utils';

export const MASK_METADATA_KEY = Symbol.for('MASK_METADATA');

export function Mask(options?: MaskOptions) {
  return function (target: object, propertyKey: string | symbol) {
    const existing = (Reflect.getMetadata(MASK_METADATA_KEY, target) ||
      {}) as Record<string | symbol, MaskOptions>;
    existing[propertyKey] = options || { autoDetect: true };
    Reflect.defineMetadata(MASK_METADATA_KEY, existing, target);
  };
}
