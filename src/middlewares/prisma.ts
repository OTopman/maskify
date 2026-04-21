import { MaskifyCore } from '../core/maskify';
import { MiddlewareOptions } from '../utils';
import { GlobalConfigLoader } from '../utils/config';
import { buildSchemaFromFields } from '../utils/schema-builder';

const READ_OPERATIONS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'queryRaw',
  'aggregate',
  'groupBy',
]);

interface PrismaAllOperationsArgs {
  model: string;
  operation: string;
  args: unknown;
  query: (args: unknown) => Promise<unknown>;
}

export function prisma(options?: MiddlewareOptions) {
  const config = options || GlobalConfigLoader.load();
  const { fields, maskOptions: globalOptions } = config;
  const schema = buildSchemaFromFields(fields, globalOptions);

  return {
    name: 'maskify-prisma',
    query: {
      $allModels: {
        async $allOperations({ operation, args, query }: PrismaAllOperationsArgs) {
          const result = await query(args);
          if (!READ_OPERATIONS.has(operation) || result == null) return result;
          if (typeof result !== 'object') return result;

          return schema
            ? MaskifyCore.maskSensitiveFields(result as object, schema)
            : MaskifyCore.autoMask(result as object, globalOptions);
        },
      },
    },
  };
}
