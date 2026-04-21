import { Transform, TransformCallback } from 'stream';
import { MaskifyCore } from '../core/maskify';
import { GlobalConfigLoader, MaskOptions } from '../utils';
import { buildSchemaFromFields } from '../utils/schema-builder';

export interface MaskStreamOptions extends MaskOptions {
  /** Schema for masking fields in object mode. */
  schema?: Record<string, MaskOptions>;

  /** 'mask' (blocklist) or 'allow' (allowlist). */
  mode?: 'mask' | 'allow';

  /** Allow injecting a specific config instead of loading global file. */
  configOverride?: MaskOptions;
}

export class MaskifyStream extends Transform {
  private readonly schema: Record<string, MaskOptions> | null;
  private readonly options: MaskStreamOptions;
  private readonly configOverride?: MaskOptions;

  constructor(
    schema?: Record<string, MaskOptions>,
    options?: MaskStreamOptions,
  ) {
    super({ objectMode: true });

    this.configOverride = options?.configOverride;

    const fileConfig = GlobalConfigLoader.load();
    const globalMaskOpts = this.configOverride || fileConfig.maskOptions || {};

    this.options = {
      mode: options?.mode || fileConfig.mode || 'mask',
      ...globalMaskOpts,
      ...options,
    };

    if (schema && Object.keys(schema).length > 0) {
      this.schema = schema;
    } else {
      this.schema = buildSchemaFromFields(fileConfig.fields, globalMaskOpts);
    }
  }

  override _transform(
    chunk: unknown,
    _encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    try {
      const wasSerialized =
        Buffer.isBuffer(chunk) || typeof chunk === 'string';
      let data: unknown = chunk;

      if (wasSerialized) {
        const str = chunk!.toString();

        if (!str.trim()) {
          this.push(chunk);
          return callback();
        }

        try {
          data = JSON.parse(str);
        } catch {
          // Non-JSON text: if no schema, apply smart masking so we never
          // leak the raw line. If a schema was configured, the user likely
          // wants structural masking only — pass through untouched.
          if (!this.schema) {
            this.push(
              MaskifyCore.mask(str, { ...this.options, autoDetect: true }),
            );
            return callback();
          }
          this.push(chunk);
          return callback();
        }
      }

      if (!data || typeof data !== 'object') {
        this.push(chunk);
        return callback();
      }

      const masked = this.schema
        ? MaskifyCore.maskSensitiveFields(
            data as object,
            this.schema,
            { mode: this.options.mode, defaultMask: this.options },
            this.configOverride,
          )
        : MaskifyCore.autoMask(data as object, this.options);

      this.push(wasSerialized ? JSON.stringify(masked) + '\n' : masked);
      callback();
    } catch {
      // Never drop a chunk: fall through with the original value so the
      // pipeline stays intact even when one record is malformed.
      callback(null, chunk);
    }
  }
}

export function createMaskStream(
  schema?: Record<string, MaskOptions>,
  options?: MaskStreamOptions,
) {
  return new MaskifyStream(schema, options);
}
