import { MaskifyCore } from '../core/maskify';
import { MiddlewareOptions } from '../utils';
import { GlobalConfigLoader } from '../utils/config';
import { buildSchemaFromFields } from '../utils/schema-builder';

/**
 * Axiomify (https://github.com/OTopman/axiomify) plugin.
 *
 * Untyped against `@axiomify/core` on purpose — same convention as the
 * Prisma/Mongoose/TypeORM adapters, none of which are peer dependencies.
 *
 * Masking here must stay SYNCHRONOUS. Axiomify's `res.send()` serializes
 * and writes to the socket before returning (`NativeResponse.send()` is
 * fully sync, and `SerializerFn` construction rejects async serializers
 * outright), and `onPostHandler` hooks — e.g. `@axiomify/logger` reading
 * `res.payload` — run immediately after the handler with no await on
 * `res.send()`'s internal work. Deferring the real send into a microtask
 * (the way the Express/Fastify adapters do for async maskers) would let
 * those hooks observe a response that isn't masked yet. Async custom
 * maskers (e.g. the WebCrypto deterministic masker) aren't supported
 * through this integration — mask those fields in the handler yourself
 * before calling `res.send()`.
 */
export function axiomify<T = any>(app: any, options?: MiddlewareOptions<T>): void {
  const config = options || GlobalConfigLoader.load();
  const { fields, maskOptions: globalOptions } = config;
  const schema = buildSchemaFromFields(fields, globalOptions);

  const applyMask = (data: object) =>
    schema
      ? MaskifyCore.maskSensitiveFields(data, schema)
      : MaskifyCore.autoMask(data, globalOptions);

  app.addHook('onRequest', (_req: any, res: any) => {
    const originalSend = res.send.bind(res);

    res.send = (data: unknown, message?: string) => {
      if (!data || typeof data !== 'object') {
        return originalSend(data, message);
      }
      try {
        return originalSend(applyMask(data as object), message);
      } catch {
        // Never block the response if masking fails.
        return originalSend(data, message);
      }
    };
  });
}
