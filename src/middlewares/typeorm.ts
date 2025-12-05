import { Maskify } from '../index';

export class TypeORMSubscriber {
  /**
   * Called after entity is loaded.
   * Modifies the entity in-place because TypeORM hooks expect mutation.
   */
  afterLoad(entity: any) {
    if (!entity) return;

    // 1. Get metadata key (must match the one used in decorators)
    const MASK_METADATA_KEY = Symbol.for('MASK_METADATA');

    // 2. Check prototype for decorated properties
    const proto = Object.getPrototypeOf(entity);
    if (!proto) return;

    const metadata = Reflect.getMetadata(MASK_METADATA_KEY, proto);
    if (!metadata) return;

    // 3. Apply masking IN-PLACE
    for (const key of Object.keys(metadata)) {
      if (entity[key]) {
        entity[key] = Maskify.mask(entity[key], metadata[key]);
      }
    }
  }
}

export const typeorm = () => new TypeORMSubscriber();
