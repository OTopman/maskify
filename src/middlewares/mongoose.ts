import { MaskifyCore } from '../core/maskify';
import { MiddlewareOptions } from '../utils';
import { buildSchemaFromFields } from '../utils/schema-builder';

export function mongoose(schema: any, options: MiddlewareOptions = {}) {
  const { fields, maskOptions: globalOptions } = options;
  const maskSchema = buildSchemaFromFields(fields, globalOptions);

  const applyMask = (payload: object) =>
    maskSchema
      ? MaskifyCore.maskSensitiveFields(payload, maskSchema)
      : MaskifyCore.autoMask(payload, globalOptions);

  schema.methods.mask = function () {
    const plain = typeof this.toObject === 'function' ? this.toObject() : this;
    return applyMask(plain);
  };

  schema.set('toJSON', {
    transform: (_doc: unknown, ret: object) => applyMask(ret),
  });
}
