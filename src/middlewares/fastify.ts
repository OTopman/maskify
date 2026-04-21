import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { MaskifyCore } from '../core/maskify';
import { MiddlewareOptions } from '../utils';
import { GlobalConfigLoader } from '../utils/config';
import { buildSchemaFromFields } from '../utils/schema-builder';

const fastifyPlugin = async (
  app: FastifyInstance,
  options?: MiddlewareOptions,
) => {
  const config = options || GlobalConfigLoader.load();
  const { fields, maskOptions: globalOptions } = config;
  const schema = buildSchemaFromFields(fields, globalOptions);

  const maskPayload = (payload: unknown) =>
    schema
      ? MaskifyCore.maskSensitiveFields(payload as object, schema)
      : MaskifyCore.autoMask(payload as object, globalOptions);

  app.addHook(
    'onSend',
    async (_req: FastifyRequest, _reply: FastifyReply, payload: unknown) => {
      if (payload == null) return payload;

      try {
        if (Buffer.isBuffer(payload) || typeof payload === 'string') {
          const str = Buffer.isBuffer(payload)
            ? payload.toString('utf-8')
            : payload;
          const parsed = JSON.parse(str);
          if (!parsed || typeof parsed !== 'object') return payload;
          return JSON.stringify(maskPayload(parsed));
        }

        if (typeof payload === 'object') {
          return JSON.stringify(maskPayload(payload));
        }

        return payload;
      } catch {
        // If parsing/masking fails we must never block the response —
        // return the original payload untouched.
        return payload;
      }
    },
  );
};

export const fastify = fp(fastifyPlugin, { name: 'maskify-ts' });
