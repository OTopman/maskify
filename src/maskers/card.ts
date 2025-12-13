import { MaskOptions } from '../utils';
import { DEFAULT_MASK_OPTIONS } from '../utils/defaults';

/**
 * Masks credit card numbers, preserving the last 4 digits.
 * @param card - The raw card number.
 * @param options - Configuration for masking characters.
 */
export function maskCard(card: string, options: MaskOptions = {}): string {
  const { maxAsterisks, maskChar } = { ...DEFAULT_MASK_OPTIONS, ...options };

  if (!card) return '';

  const digitsOnly = card.replace(/\D/g, '');
  // Split into groups of 4 for formatting
  const groups = digitsOnly.match(/.{1,4}/g) || [];

  const maskedGroups = groups.map((group, i) =>
    // Preserve first and last group, mask the middle ones
    i === 0 || i === groups.length - 1 ? group : maskChar!.repeat(maxAsterisks!)
  );

  return maskedGroups.join(' ');
}
