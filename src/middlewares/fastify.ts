import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { MaskifyCore } from '../core/maskify';
import { MiddlewareOptions } from '../utils';
import { GlobalConfigLoader } from '../utils/config';
import { buildSchemaFromFields } from '../utils/schema-builder';

const fastifyPlugin = async <T = any>(
  app: FastifyInstance,
  options?: MiddlewareOptions<T>,
) => {
  const config = options || GlobalConfigLoader.load();
  const { fields, maskOptions: globalOptions } = config;
  const schema = buildSchemaFromFields(fields, globalOptions);

  const maskPayload = (payload: unknown) =>
    schema
      ? MaskifyCore.maskSensitiveFields(payload as object, schema)
      : MaskifyCore.autoMask(payload as object, globalOptions);

  app.addHook(
    'preSerialization',
    async (_req: FastifyRequest, _reply: FastifyReply, payload: unknown) => {
      if (payload == null || typeof payload !== 'object') return payload;

      // If the payload is stream-like (contains a pipe method), bypass masking
      if (typeof (payload as any).pipe === 'function') {
        return payload;
      }

      try {
        return maskPayload(payload);
      } catch {
        // If masking fails we must never block the response —
        // return the original payload untouched.
        return payload;
      }
    },
  );
};

// Try to dynamically load fastify-plugin. If it fails, export a placeholder function
// that throws an error only when executed, preventing module-load crashes.
let fp: any;
try {
  fp = typeof require !== 'undefined' ? require('fastify-plugin') : undefined;
} catch {
  // fastify-plugin is not installed or failed to load
}

export const fastify: <T = any>(
  app: FastifyInstance,
  options?: MiddlewareOptions<T>,
) => any = fp
  ? fp(fastifyPlugin, { name: 'maskify-ts' })
  : (_app: any, _options?: any) => {
      throw new Error(
        'fastify-plugin is required to use the fastify middleware of maskify-ts. ' +
        'Please run `npm install fastify-plugin`.'
      );
    };
