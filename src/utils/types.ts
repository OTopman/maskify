export type MaskableType =
  | 'email'
  | 'phone'
  | 'card'
  | 'address'
  | 'name'
  | 'generic'
  | 'ip'
  | 'jwt'
  | 'url';

export interface MaskOptions {
  /** Throw typed errors for invalid input */
  strict?: boolean;

  /** Maximum input length before truncation/failure */
  maxLength?: number;

  /** Allow empty string values */
  allowEmpty?: boolean;

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

  /** Custom transformation function (overrides other options) */
  transform?: (value: string) => string;

  /**
   * Secret used by deterministic masking.
   * Prefer `Maskify.deterministic()` for explicit usage.
   */
  secret?: string;

  /** Context-aware masking condition: returns true to mask, false to skip. */
  condition?: (value: string, context?: unknown) => boolean;

  /** Arbitrary context passed to condition */
  context?: unknown;

  /** Redact instead of masking with characters */
  redact?: boolean;

  /** Custom label for redaction (e.g. "[CONFIDENTIAL]"). If omitted, defaults to [REDACTED_TYPE] */
  label?: string;
}

export interface AutoMaskOptions extends MaskOptions {
  /** List of keys to automatically mask (e.g. "password", "secret") */
  sensitiveKeys?: string[];

  /** List of types to automatically detect in values (e.g. "email", "ip") */
  autoDetectTypes?: MaskableType[];
}

export interface MaskSchemaOptions {
  /** * 'mask' (default): Only masks fields defined in the schema.
   * 'allow': Masks EVERYTHING, leaving only schema fields visible.
   */
  mode?: 'mask' | 'allow';

  /** Options to use for fields that are masked by default in 'allow' mode */
  defaultMask?: MaskOptions;

  /** Context to forward to masking callbacks/conditions */
  context?: unknown;
}

export type MiddlewareField<T = any> =
  | (Paths<T> & string)
  | {
      name: Paths<T> & string;
      options?: MaskOptions;
    };

export interface MiddlewareOptions<T = any> {
  /**
   * List of fields to mask.
   * Each field can be a string (uses global maskOptions)
   * or an object with custom per-field options.
   */
  fields?: MiddlewareField<T>[];

  /**
   * Global mask options applied if field-specific options are not provided.
   */
  maskOptions?: AutoMaskOptions;
}

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * Utility type to extract all valid dot-notation paths of an object/array.
 */
export type Paths<T, Depth extends number = 5> = [Depth] extends [never]
  ? never
  : T extends any[]
  ?
      | `[*]`
      | `[${number}]`
      | (T[number] extends object
          ? | `[*].${Paths<T[number], Prev[Depth]>}`
            | `[${number}].${Paths<T[number], Prev[Depth]>}`
          : never)
  : T extends object
  ? {
      [K in keyof T & (string | number)]: T[K] extends any[]
        ?
            | `${K}`
            | `${K}[*]`
            | `${K}[${number}]`
            | (T[K][number] extends object
                ? | `${K}[*].${Paths<T[K][number], Prev[Depth]>}`
                  | `${K}[${number}].${Paths<T[K][number], Prev[Depth]>}`
                : never)
        : T[K] extends object
        ?
            | `${K}`
            | `${K}.${Paths<T[K], Prev[Depth]>}`
        : `${K}`;
    }[keyof T & (string | number)]
  : never;
