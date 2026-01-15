import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { MaskifyCore } from '../core/maskify';
import { MiddlewareOptions } from '../utils';
import { GlobalConfigLoader } from '../utils/config';

const fastifyPlugin = async (
  app: FastifyInstance,
  options?: MiddlewareOptions
) => {
  // 1. Resolve Config
  const config = options || GlobalConfigLoader.load();
  const { fields, maskOptions: globalOptions } = config;

  let schema: Record<string, any> | null = null;

  if (fields && fields.length > 0) {
    schema = Object.fromEntries(
      fields.map((f) => {
        if (typeof f === 'string') return [f, globalOptions || {}];
        return [f.name, { ...(globalOptions || {}), ...(f.options || {}) }];
      })
    );
  }

  app.addHook(
    'onSend',
    async (_req: FastifyRequest, _reply: FastifyReply, payload: unknown) => {
      if (!payload) return payload;

      try {
        let jsonString: string;
        if (Buffer.isBuffer(payload)) {
          jsonString = payload.toString('utf-8');
        } else if (typeof payload === 'string') {
          jsonString = payload;
        } else {
          if (schema) {
            return JSON.stringify(MaskifyCore.maskSensitiveFields(payload as object, schema));
          }
          return JSON.stringify(MaskifyCore.autoMask(payload as object, globalOptions));
        }

        const json = JSON.parse(jsonString);
        let masked;

        if (schema) {
          masked = MaskifyCore.maskSensitiveFields(json, schema);
        } else {
          masked = MaskifyCore.autoMask(json, globalOptions);
        }

        return JSON.stringify(masked);
      } catch (err) {
        return payload;
      }
    }
  );
};

export const fastify = fp(fastifyPlugin, {
  name: 'maskify-ts',
});