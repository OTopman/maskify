import { MaskifyCore } from '../core/maskify';
import { MiddlewareOptions } from '../utils';

export function mongoose(schema: any, options: MiddlewareOptions) {
  const { fields, maskOptions: globalOptions } = options;
  let maskSchema: Record<string, any> | null = null;

  if (fields && fields.length > 0) {
    maskSchema = Object.fromEntries(
      fields.map((f) => {
        if (typeof f === 'string') return [f, globalOptions || {}];
        return [f.name, { ...(globalOptions || {}), ...(f.options || {}) }];
      })
    );
  }

  // 1. Add .mask() method to documents
  schema.methods.mask = function () {
    const obj = this.toObject();
    if (maskSchema) {
      return MaskifyCore.maskSensitiveFields(obj, maskSchema);
    }
    return MaskifyCore.autoMask(obj, globalOptions);
  };

  // 2. Automatic masking on JSON serialization
  schema.set('toJSON', {
    transform: (doc: any, ret: any) => {
      if (maskSchema) {
        return MaskifyCore.maskSensitiveFields(ret, maskSchema);
      }
      return MaskifyCore.autoMask(ret, globalOptions);
    },
  });
}
