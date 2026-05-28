import { z } from 'zod';
import { Maskify } from '../index';
import type { MaskOptions, Paths } from '../utils/types';

/**
 * Zod schema preprocessor / transformer that masks sensitive fields in an object schema.
 *
 * @param schema - The Zod schema representing the object to mask.
 * @param maskSchema - Configuration mapping fields/dot paths to MaskOptions.
 */
export function zodMask<T extends z.ZodTypeAny>(
  schema: T,
  maskSchema: Partial<Record<Paths<z.output<T>> & string, MaskOptions>>
): z.ZodEffects<T, z.output<T>, z.input<T>> {
  return schema.transform((val) => {
    if (val && typeof val === 'object') {
      return Maskify.maskSensitiveFields(val as any, maskSchema as any);
    }
    return val;
  });
}

/**
 * Pre-configured Zod string field schema that automatically masks input strings.
 * Can be made optional or nullable using .optional() / .nullable().
 *
 * @param options - Masking options.
 */
export function zodMaskField(options?: MaskOptions): z.ZodEffects<z.ZodString, string, string> {
  return z.string().transform((val) => Maskify.mask(val, options));
}
