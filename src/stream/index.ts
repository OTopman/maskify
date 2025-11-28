import { Transform, TransformCallback } from 'stream';
import { MaskifyCore } from '../core/maskify';
import { MaskOptions } from '../utils';

export interface MaskStreamOptions extends Transform {
  schema: Record<string, MaskOptions>;
}

export class MaskifyStream extends Transform {
  private schema: Record<string, MaskOptions>;

  constructor(schema: Record<string, MaskOptions>) {
    super({ objectMode: true }); // Enable object mode for passing JSON objects directly
    this.schema = schema;
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
          // If it's not JSON (e.g. plain text log line), pass it through untouched
          this.push(chunk);
          return callback();
        }
      }

      // Perform Masking
      const masked = MaskifyCore.maskSensitiveFields(data, this.schema);

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
export function createMaskStream(schema: Record<string, MaskOptions>) {
  return new MaskifyStream(schema);
}
