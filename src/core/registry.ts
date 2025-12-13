import { MaskOptions } from '../utils';

// Standard function signature for all maskers
export type MaskerFn = (value: string, options: MaskOptions) => string;

class MaskerRegistry {
  private maskers = new Map<string, MaskerFn>();

  /**
   * Register a new masker function for a specific type.
   * @param type - The unique identifier (e.g., 'email', 'phone')
   * @param masker - The function to execute
   */
  register(type: string, masker: MaskerFn) {
    this.maskers.set(type, masker);
  }

  /**
   * Retrieve a masker by type.
   */
  get(type: string): MaskerFn | undefined {
    return this.maskers.get(type);
  }

  /**
   * Check if a masker exists (useful for debugging/validation)
   */
  has(type: string): boolean {
    return this.maskers.has(type.toLowerCase());
  }
}


/**
 * Global singleton instance of the registry.
 */
export const registry = new MaskerRegistry();
