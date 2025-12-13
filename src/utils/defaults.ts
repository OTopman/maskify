import { MaskOptions } from './types';

/**
 * Shared default values to ensure consistency across all maskers.
 */
export const DEFAULT_MASK_OPTIONS: Partial<MaskOptions> = {
  maskChar: '*',
  maxAsterisks: 4,
  visibleStart: 0,
  visibleEnd: 0,
};
