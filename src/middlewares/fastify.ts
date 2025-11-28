import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { MaskifyCore } from '../core/maskify';
import { MiddlewareOptions } from '../utils';

/**
 * Fastify plugin wrapped in `fp` to ensure the 'onSend' hook
 * applies globally to all routes registered after it.
 */
const fastifyPlugin = async (
  app: FastifyInstance,
  options: MiddlewareOptions
) => {
  const { fields, maskOptions: globalOptions } = options;

  // Pre-calculate schema
  const schema = Object.fromEntries(
    fields.map((f) => {
      if (typeof f === 'string') return [f, globalOptions || {}];
      return [f.name, { ...(globalOptions || {}), ...(f.options || {}) }];
    })
  );

  app.addHook(
    'onSend',
    async (_req: FastifyRequest, _reply: FastifyReply, payload: unknown) => {
      // 1. Safety checks
      if (!payload) return payload;

      try {
        let jsonString: string;

        // 2. Normalize payload to string
        if (Buffer.isBuffer(payload)) {
          jsonString = payload.toString('utf-8');
        } else if (typeof payload === 'string') {
          jsonString = payload;
        } else {
          // Already an object? (Rare in onSend, but handle it)
          return JSON.stringify(
            MaskifyCore.maskSensitiveFields(payload as object, schema)
          );
        }

        // 3. Parse, Mask, Stringify
        const json = JSON.parse(jsonString);
        const masked = MaskifyCore.maskSensitiveFields(json, schema);
        return JSON.stringify(masked);
      } catch (err) {
        // If parsing fails (e.g. HTML/Plain text), return original
        return payload;
      }
    }
  );
};

// Export wrapped plugin
export const fastify = fp(fastifyPlugin, {
  name: 'maskify-ts',
});
