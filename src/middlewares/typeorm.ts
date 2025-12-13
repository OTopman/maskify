import { applyAutoStrategy } from '../core/strategies/auto-strategy';
import { Maskify } from '../index';
import { MiddlewareOptions } from '../utils';

export class TypeORMSubscriber {
  private options?: MiddlewareOptions;

  constructor(options?: MiddlewareOptions) {
    this.options = options;
  }

  /**
   * Called after entity is loaded.
   * Modifies the entity in-place because TypeORM hooks expect mutation.
   */
  afterLoad(entity: any) {
    if (!entity) return;

    // A. Decorator Strategy (Existing)
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

    // B. Auto-Mask Strategy (New)
    // If no fields provided (or explicitly desired), we run auto-mask in-place.
    // Note: We use applyAutoStrategy directly to mutate 'entity' without cloning.
    if (
      this.options &&
      (!this.options.fields || this.options.fields.length === 0)
    ) {
      applyAutoStrategy(entity, this.options.maskOptions);
    }
  }
}

export const typeorm = (options?: MiddlewareOptions) =>
  new TypeORMSubscriber(options);
