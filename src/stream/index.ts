import { Transform, TransformCallback } from 'stream';
import { MaskifyCore } from '../core/maskify';
import { GlobalConfigLoader, MaskOptions } from '../utils';
import { Maskify } from '..';

export interface MaskStreamOptions extends MaskOptions {
  /** Schema for masking fields in object mode */
  schema?: Record<string, MaskOptions>;

  /** 'mask' (blocklist) or 'allow' (allowlist) */
  mode?: 'mask' | 'allow';
}

export class MaskifyStream extends Transform {
  private schema: Record<string, MaskOptions>;
  private options: MaskStreamOptions;

  constructor(
    schema?: Record<string, MaskOptions>,
    options?: MaskStreamOptions
  ) {
    super({ objectMode: true }); // Enable object mode for passing JSON objects directly

    // Load Global Config
    const globalConfig = GlobalConfigLoader.load();

    // If no schema provided, maybe use global 'fields' from config?
    // For streams, explicit schema is usually preferred, but we can fallback.
    let effectiveSchema = schema || {};
    if (!schema && globalConfig.fields) {
      const globalMaskOpts = globalConfig.maskOptions || {};
      effectiveSchema = Object.fromEntries(
        globalConfig.fields.map((field) => [field, globalMaskOpts])
      );
    }

    this.schema = effectiveSchema;
    
    this.options = {
      mode: options?.mode || globalConfig.mode || 'mask',
      ...globalConfig.maskOptions, // Global defaults
      ...options, // User overrides
    };
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
          // Not JSON? Maybe use Smart Compiler here for unstructured logs?
          // For now, let's pass through or implement smart masking for strings
          // If the user didn't provide a schema, we assume they might want smart masking on strings
          if (Object.keys(this.schema).length === 0) {
            const masked = Maskify.smart(str);
            this.push(masked);
            this.push(chunk); // Default behavior: pass through
            return callback();
          }
          this.push(chunk);
          return callback();
        }
      }

      // Perform Masking
      const masked = MaskifyCore.maskSensitiveFields(data, this.schema, {
        mode: this.options.mode,
        defaultMask: this.options,
      });

      // Push back in the same format received
      if (isBuffer) {
        this.push(JSON.stringify(masked) + '\n');
      } else {
        this.push(masked);
      }
      callback();
    } catch (err) {
      // Allow stream to continue even if one line fails
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
