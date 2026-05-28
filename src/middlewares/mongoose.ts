import { MaskifyCore } from '../core/maskify';
import { MiddlewareOptions } from '../utils';
import { buildSchemaFromFields } from '../utils/schema-builder';

export function mongoose<T = any>(schema: any, options: MiddlewareOptions<T> = {}) {
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

  const existing = schema.get('toJSON') || {};
  const existingTransform = existing.transform;

  schema.set('toJSON', {
    ...existing,
    transform: (doc: any, ret: any, options: any) => {
      let val = ret;
      if (typeof existingTransform === 'function') {
        val = existingTransform(doc, ret, options);
      }
      return applyMask(val);
    },
  });
}
