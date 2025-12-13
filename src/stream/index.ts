import { Transform, TransformCallback } from 'stream';
import { MaskifyCore } from '../core/maskify';
import { GlobalConfigLoader, MaskOptions } from '../utils';

export interface MaskStreamOptions extends MaskOptions {
  /** Schema for masking fields in object mode */
  schema?: Record<string, MaskOptions>;

  /** 'mask' (blocklist) or 'allow' (allowlist) */
  mode?: 'mask' | 'allow';

  /** Allow injecting a specific config instead of loading global file */
  configOverride?: MaskOptions;
}

export class MaskifyStream extends Transform {
  private schema: Record<string, MaskOptions>;
  private options: MaskStreamOptions;
  private configOverride?: MaskOptions;

  constructor(
    schema?: Record<string, MaskOptions>,
    options?: MaskStreamOptions
  ) {
    super({ objectMode: true }); // Enable object mode for passing JSON objects directly

    this.configOverride = options?.configOverride;

    // 1. Load File Config (once)
    const fileConfig = GlobalConfigLoader.load();

    // 2. Resolve Effective Global Options (Injection > File > Empty)
    const globalMaskOpts = this.configOverride || fileConfig.maskOptions || {};

    // 3. Merge Options
    this.options = {
      mode: options?.mode || fileConfig.mode || 'mask',
      ...globalMaskOpts,
      ...options,
    };

    // 4. Resolve Schema
    // If no schema provided, fallback to 'fields' from the loaded config
    let effectiveSchema = schema || {};
    if (!schema && fileConfig.fields) {
      effectiveSchema = Object.fromEntries(
        fileConfig.fields.map((field) => [field, globalMaskOpts])
      );
    }

    this.schema = effectiveSchema;
  }

  _transform(
    chunk: any,
    encoding: BufferEncoding,
    callback: TransformCallback
  ) {
    try {
      let data = chunk;
      let isBuffer = false;

      // Handle Buffer/String input (e.g. from file read)
      if (Buffer.isBuffer(chunk) || typeof chunk === 'string') {
        isBuffer = true;
        const str = chunk.toString();

        // Skip empty lines
        if (!str.trim()) {
          this.push(chunk);
          return callback();
        }

        try {
          data = JSON.parse(str);
        } catch {
          // Not JSON?
          // Fallback: Smart Masking on unstructured text
          // If no schema was provided, we assume the user wants to scan the raw string.
          if (Object.keys(this.schema).length === 0) {
            // Fix: Use MaskifyCore directly to avoid circular dependency with index.ts
            const masked = MaskifyCore.mask(str, {
              ...this.options,
              autoDetect: true,
            });

            this.push(masked);
            // 🛑 REMOVED: this.push(chunk); -> This was leaking the original data!
            return callback();
          }

          // If a schema WAS provided but parsing failed, we can't apply it.
          // Pass through original or error out? Standard streams pass through on partial failure.
          this.push(chunk);
          return callback();
        }
      }

      // Perform Masking on Object
      const masked = MaskifyCore.maskSensitiveFields(
        data,
        this.schema,
        {
          mode: this.options.mode,
          defaultMask: this.options,
        },
        this.configOverride // Pass injected config to core
      );

      // Push back in the same format received
      if (isBuffer) {
        this.push(JSON.stringify(masked) + '\n');
      } else {
        this.push(masked);
      }
      callback();
    } catch (err) {
      // Allow stream to continue even if one line fails
      // In production, you might want to emit an 'error' event or log this.
      callback(null, chunk);
    }
  }
}

/**
 * Helper to create a stream
 */
export function createMaskStream(
  schema?: Record<string, MaskOptions>,
  options?: MaskStreamOptions
) {
  return new MaskifyStream(schema, options);
}
