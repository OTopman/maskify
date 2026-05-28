import { MaskifyCore } from '../core/maskify';
import { applyAutoStrategy } from '../core/strategies/auto-strategy';
import { getMaskMetadata } from '../decorators/mask';
import { MaskOptions, MiddlewareField, MiddlewareOptions } from '../utils';
import { safeClone } from '../utils/clone';
import { GlobalConfigLoader } from '../utils/config';
import { buildSchemaFromFields } from '../utils/schema-builder';

/**
 * TypeORM EntitySubscriber that masks entities on serialization only.
 *
 * Mutating loaded entities in-place would cause TypeORM's UnitOfWork to
 * persist masked values on the next save. Instead, this subscriber installs
 * a `toJSON()` override on the loaded entity so HTTP responses and
 * `JSON.stringify()` produce masked output while the in-memory entity
 * remains writable.
 */
export class TypeORMSubscriber<Entity = any> {
  private readonly options: MiddlewareOptions<Entity>;
  private readonly schema: Record<string, MaskOptions> | null;

  constructor(options?: MiddlewareOptions<Entity>) {
    this.options = options || (GlobalConfigLoader.load() as any);
    this.schema = buildSchemaFromFields(
      this.options.fields as MiddlewareField<Entity>[] | undefined,
      this.options.maskOptions,
    );
  }

  afterLoad(entity: any): void {
    if (!entity || typeof entity !== 'object') return;

    const decoratorMeta = entity ? getMaskMetadata(entity) : null;

    const schema = this.schema;
    const maskOptions = this.options.maskOptions;
    const originalToJSON =
      typeof entity.toJSON === 'function' ? entity.toJSON.bind(entity) : null;

    Object.defineProperty(entity, 'toJSON', {
      configurable: true,
      writable: true,
      enumerable: false,
      value: function toJSON() {
        const source = originalToJSON ? originalToJSON() : { ...this };
        const clone = safeClone(source);

        if (decoratorMeta) {
          for (const key of Object.keys(decoratorMeta)) {
            const value = (clone as any)[key];
            if (value !== undefined && value !== null) {
              (clone as any)[key] = MaskifyCore.mask(
                String(value),
                decoratorMeta[key],
              );
            }
          }
        }

        if (schema) {
          return MaskifyCore.maskSensitiveFields(clone, schema);
        }
        if (!decoratorMeta) {
          applyAutoStrategy(clone, maskOptions);
        }
        return clone;
      },
    });
  }
}

export const typeorm = <T = any>(options?: MiddlewareOptions<T>) =>
  new TypeORMSubscriber<T>(options);
