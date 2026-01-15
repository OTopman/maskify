import { applyAutoStrategy } from '../core/strategies/auto-strategy';
import { Maskify } from '../index';
import { MiddlewareOptions } from '../utils';
import { GlobalConfigLoader } from '../utils/config';

export class TypeORMSubscriber {
  private options: MiddlewareOptions;

  constructor(options?: MiddlewareOptions) {
    // 1. Resolve Config
    this.options = options || GlobalConfigLoader.load();
  }

  afterLoad(entity: any) {
    if (!entity) return;

    // A. Decorator Strategy
    const MASK_METADATA_KEY = Symbol.for('MASK_METADATA');
    const proto = Object.getPrototypeOf(entity);
    if (proto) {
      const metadata = Reflect.getMetadata(MASK_METADATA_KEY, proto);
      if (metadata) {
        for (const key of Object.keys(metadata)) {
          if (entity[key]) {
            entity[key] = Maskify.mask(entity[key], metadata[key]);
          }
        }
      }
    }

    // B. Auto-Mask Strategy
    if (!this.options.fields || this.options.fields.length === 0) {
      applyAutoStrategy(entity, this.options.maskOptions);
    }
  }
}

export const typeorm = (options?: MiddlewareOptions) =>
  new TypeORMSubscriber(options);