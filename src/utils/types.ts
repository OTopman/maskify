export type MaskableType =
  | 'email'
  | 'phone'
  | 'card'
  | 'address'
  | 'name'
  | 'generic';

export interface MaskOptions {
  /** Number of visible characters at the start */
  visibleStart?: number;

  /** Number of visible characters at the end */
  visibleEnd?: number;

  /** Maximum number of asterisks used in masking */
  maxAsterisks?: number;

  /** Automatically detect input type (email, phone, etc.) */
  autoDetect?: boolean;

  /** Force a specific masking type */
  type?: MaskableType;

  /** Character used for masking (default: '*') */
  maskChar?: string;
  pattern?: string;
}

export type MaskSchema = Record<string, MaskOptions>;

export type MiddlewareField =
  | string
  | {
      name: string;
      options?: MaskOptions;
    };

export interface MiddlewareOptions {
  /**
   * List of fields to mask.
   * Each field can be a string (uses global maskOptions)
   * or an object with custom per-field options.
   */
  fields: (string | { name: string; options?: MaskOptions })[];

  /**
   * Global mask options applied if field-specific options are not provided.
   */
  maskOptions?: MaskOptions;
}
