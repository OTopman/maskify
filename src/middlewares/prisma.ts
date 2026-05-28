import { MaskifyCore } from '../core/maskify';
import { MiddlewareOptions } from '../utils';
import { GlobalConfigLoader } from '../utils/config';
import { buildSchemaFromFields } from '../utils/schema-builder';

const INTERCEPTED_OPERATIONS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'create',
  'createMany',
  'update',
  'updateMany',
  'upsert',
  'delete',
  'deleteMany',
  'aggregate',
  'groupBy',
]);

interface PrismaAllOperationsArgs {
  model: string;
  operation: string;
  args: unknown;
  query: (args: unknown) => Promise<unknown>;
}

export function prisma<T = any>(options?: MiddlewareOptions<T>) {
  const config = options || GlobalConfigLoader.load();
  const { fields, maskOptions: globalOptions } = config;
  const schema = buildSchemaFromFields(fields, globalOptions);

  const applyMask = (result: any) => {
    if (result == null || typeof result !== 'object') return result;
    return schema
      ? MaskifyCore.maskSensitiveFields(result as object, schema)
      : MaskifyCore.autoMask(result as object, globalOptions);
  };

  return {
    name: 'maskify-prisma',
    query: {
      $allModels: {
        async $allOperations({ operation, args, query }: PrismaAllOperationsArgs) {
          const result = await query(args);
          if (!INTERCEPTED_OPERATIONS.has(operation)) return result;
          return applyMask(result);
        },
      },
      async $queryRaw({ args, query }: any) {
        const result = await query(args);
        return applyMask(result);
      },
      async $queryRawUnsafe({ args, query }: any) {
        const result = await query(args);
        return applyMask(result);
      },
    },
  };
}
