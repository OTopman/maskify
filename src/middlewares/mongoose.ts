import { MaskifyCore } from '../core/maskify';
import { MiddlewareOptions } from '../utils';

export function mongoose(schema: any, options: MiddlewareOptions) {
  const { fields, maskOptions: globalOptions } = options;

  const maskSchema = Object.fromEntries(
    fields.map((f) => {
      if (typeof f === 'string') return [f, globalOptions || {}];
      return [f.name, { ...(globalOptions || {}), ...(f.options || {}) }];
    })
  );

  // 1. Add .mask() method to documents
  schema.methods.mask = function () {
    const obj = this.toObject();
    return MaskifyCore.maskSensitiveFields(obj, maskSchema);
  };

  // 2. Automatic masking on JSON serialization (optional hook)
  schema.set('toJSON', {
    transform: (doc: any, ret: any) => {
      return MaskifyCore.maskSensitiveFields(ret, maskSchema);
    },
  });
}
