import type { MaskOptions, MiddlewareField } from './types';

/**
 * Normalizes a middleware `fields` config into a path→options schema.
 * Returns `null` when no fields are configured so callers can fall back
 * to auto-mask strategies without additional branching.
 */
export function buildSchemaFromFields(
  fields: MiddlewareField[] | undefined,
  globalOptions?: MaskOptions,
): Record<string, MaskOptions> | null {
  if (!fields || fields.length === 0) return null;

  const schema: Record<string, MaskOptions> = {};
  for (const field of fields) {
    if (typeof field === 'string') {
      schema[field] = { ...(globalOptions || {}) };
      continue;
    }
    if (field && typeof field === 'object' && typeof field.name === 'string') {
      schema[field.name] = {
        ...(globalOptions || {}),
        ...(field.options || {}),
      };
    }
  }
  return Object.keys(schema).length > 0 ? schema : null;
}
