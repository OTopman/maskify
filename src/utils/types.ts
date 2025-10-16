export type MaskableType = 'email' | 'phone' | 'card' | 'address' | 'name' | 'generic';

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


export interface MiddlewareOptions {
  /** Fields in the response to mask */
  fields: string[];
  /** Optional mask configuration */
  maskOptions?: MaskOptions;
}