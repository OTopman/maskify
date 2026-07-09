import { z } from 'zod';
import { registerDefaults } from '../core/bootstrap';
import { MaskifyCore } from '../core/maskify';
import type { Paths } from '../utils/types';

// Ensure the process-wide registry is populated even when this module is
// imported directly (e.g. `import { zodMask } from 'maskify-ts/zod'`)
// without first importing the main entry point. Idempotent.
registerDefaults();

/**
 * Zod schema preprocessor / transformer that masks sensitive fields in an object schema.
 *
 * @param schema - The Zod schema representing the object to mask.
 * @param maskSchema - Configuration mapping fields/dot paths to MaskOptions.
 */
export function zodMask<T extends z.ZodTypeAny>(
  schema: T,
  maskSchema: Partial<Record<Paths<z.output<T>> & string, any>>
): z.ZodEffects<T, z.output<T>, z.input<T>> {
  return schema.transform((val) => {
    if (val && typeof val === 'object') {
      return MaskifyCore.maskSensitiveFields(val as any, maskSchema as any);
    }
    return val;
  });
}

/**
 * Pre-configured Zod string field schema that automatically masks input strings.
 * Can be made optional or nullable using .optional() / .nullable().
 *
 * @param options - Masking options or functional monadic masker.
 */
export function zodMaskField(options?: any): z.ZodEffects<z.ZodString, string, string> {
  return z.string().transform((val) => MaskifyCore.mask(val, options));
}
