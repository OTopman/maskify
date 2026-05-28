import type { MaskOptions } from '../../utils/types';

/**
 * Standard signature for all masker functions (supports sync and async).
 */
export type MaskerFn = (value: string, options: MaskOptions) => Promise<string> | string;

/**
 * Injectable registry for masker functions.
 */
export class MaskerRegistry {
  private maskers = new Map<string, MaskerFn>();

  /**
   * Register a masker function for a specific type.
   */
  register(type: string, masker: MaskerFn): this {
    const key = type.toLowerCase();
    this.maskers.set(key, masker);
    return this;
  }

  /**
   * Retrieve a masker by type.
   */
  get(type: string): MaskerFn | undefined {
    return this.maskers.get(type.toLowerCase());
  }

  /**
   * Check if a masker exists for the given type.
   */
  has(type: string): boolean {
    return this.maskers.has(type.toLowerCase());
  }

  /**
   * Remove a registered masker (useful for testing).
   */
  unregister(type: string): boolean {
    return this.maskers.delete(type.toLowerCase());
  }

  /**
   * Get all registered type names.
   */
  types(): string[] {
    return Array.from(this.maskers.keys());
  }

  /**
   * Create a new isolated registry instance.
   */
  static create(): MaskerRegistry {
    return new MaskerRegistry();
  }
}

/**
 * Default process-wide registry populated by `registerDefaults()` at module
 * load.
 */
export const defaultRegistry = new MaskerRegistry();
