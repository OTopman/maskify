import { MaskifyCore } from '../core/maskify';
import { MiddlewareOptions } from '../utils';

export function prisma(options: MiddlewareOptions) {
  const { fields, maskOptions: globalOptions } = options;
  let schema: Record<string, any> | null = null;

  if (fields && fields.length > 0) {
    schema = Object.fromEntries(
      fields.map((f) => {
        if (typeof f === 'string') return [f, globalOptions || {}];
        return [f.name, { ...(globalOptions || {}), ...(f.options || {}) }];
      })
    );
  }

  return {
    name: 'maskify-prisma',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          const result = await query(args);
          // Mask on read operations
          if (
            ['findUnique', 'findFirst', 'findMany', 'queryRaw'].includes(
              operation
            )
          ) {
            if (schema) {
              return MaskifyCore.maskSensitiveFields(result, schema);
            }
            return MaskifyCore.autoMask(result, globalOptions);
          }
          return result;
        },
      },
    },
  };
}
