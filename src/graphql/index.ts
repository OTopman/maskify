import { defaultFieldResolver, GraphQLSchema } from 'graphql';
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { Maskify } from '../index';
import type { MaskOptions } from '../utils/types';

/**
 * GraphQL schema directive transformer that masks returned field values.
 *
 * @param schema - The GraphQLSchema to transform.
 * @param directiveName - The directive name to look for (default: 'mask').
 */
export function graphqlMask(
  schema: GraphQLSchema,
  directiveName: string = 'mask',
): GraphQLSchema {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const directive = getDirective(schema, fieldConfig, directiveName)?.[0];
      if (directive) {
        const { resolve = defaultFieldResolver } = fieldConfig;
        fieldConfig.resolve = async function (source, args, context, info) {
          const result = await resolve(source, args, context, info);
          if (result == null) return result;

          const maskOptions: MaskOptions = {
            ...directive,
            context,
          };

          if (Array.isArray(result)) {
            return Promise.all(
              result.map(async (item) => {
                if (typeof item === 'string') {
                  return Maskify.maskAsync(item, maskOptions);
                }
                if (item && typeof item === 'object') {
                  return Maskify.autoMaskAsync(item, maskOptions as any);
                }
                return item;
              })
            );
          }

          if (typeof result === 'string') {
            return Maskify.maskAsync(result, maskOptions);
          }

          if (result && typeof result === 'object') {
            return Maskify.autoMaskAsync(result, maskOptions as any);
          }

          return result;
        };
      }
      return fieldConfig;
    },
  });
}
