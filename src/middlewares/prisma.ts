import { MaskifyCore } from '../core/maskify';
import { MiddlewareOptions } from '../utils';

export function prisma(options: MiddlewareOptions) {
  const { fields, maskOptions: globalOptions } = options;

  const schema = Object.fromEntries(
    fields.map((f) => {
      if (typeof f === 'string') return [f, globalOptions || {}];
      return [f.name, { ...(globalOptions || {}), ...(f.options || {}) }];
    })
  );

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
            return MaskifyCore.maskSensitiveFields(result, schema);
          }
          return result;
        },
      },
    },
  };
}
