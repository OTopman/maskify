import type { MaskOptions } from '../../utils/types';

/**
 * Standard signature for all masker functions.
 */
export type MaskerFn = (value: string, options: MaskOptions) => string;

/**
 * Injectable registry for masker functions.
 *
 * ✅ Benefits:
 * - Test isolation: create fresh registry per test
 * - Tree-shaking: unused maskers can be eliminated
 * - Multi-tenant: different registries per request/context
 * - Extensibility: register custom maskers at runtime
 */
export class MaskerRegistry {
  private maskers = new Map<string, MaskerFn>();

  /**
   * Register a masker function for a specific type.
   * @param type - Unique identifier (e.g., 'email', 'custom-ssn')
   * @param masker - Function to execute
   * @returns this for chaining
   */
  register(type: string, masker: MaskerFn): this {
    const key = type.toLowerCase();
    this.maskers.set(key, masker);
    return this;
  }

  /**
   * Retrieve a masker by type.
   * @param type - The type to look up
   * @returns Masker function or undefined
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
   * Useful for testing or multi-tenant scenarios.
   */
  static create(): MaskerRegistry {
    return new MaskerRegistry();
  }
}

/**
 * Default process-wide registry populated by `registerDefaults()` at module
 * load. Prefer injecting a local `MaskerRegistry` instance in tests and
 * multi-tenant contexts so state stays isolated.
 */
export const defaultRegistry = new MaskerRegistry();
