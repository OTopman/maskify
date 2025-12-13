import { MaskOptions } from '../utils';
import { DEFAULT_MASK_OPTIONS } from '../utils/defaults';

/**
 * Masks any string value by revealing a portion at the start and end,
 * and replacing the middle section with mask characters.
 *
 * Example:
 *   maskGeneric("Temitope", { visibleStart: 2, visibleEnd: 2 }) → "Te****pe"
 */
export function maskGeneric(value: string, options: MaskOptions = {}): string {
  const { visibleStart, visibleEnd, maxAsterisks, maskChar } = {
    ...DEFAULT_MASK_OPTIONS,
    ...options,
  };

  if (!value || typeof value !== 'string') return '';

  const len = value.length;

  // If string is too short to mask properly
  if (len <= visibleStart! + visibleEnd!) {
    const maskCount = Math.min(len - 1, maxAsterisks!);
    return value[0] + maskChar!.repeat(maskCount);
  }

  const start = value.slice(0, visibleStart);
  const end = visibleEnd! > 0 ? value.slice(-visibleEnd!) : '';
  const maskCount = Math.min(
    maxAsterisks!,
    Math.max(len - visibleStart! - visibleEnd!, 3)
  );

  return `${start}${maskChar!.repeat(maskCount)}${end}`;
}
