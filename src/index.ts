import type { Application as ExpressApp } from 'express';
import type { FastifyInstance } from 'fastify';
import { registerDefaults } from './core/bootstrap';
import { SmartMasker } from './core/compiler';
import { MaskifyCore } from './core/maskify';
import { maskDeterministic, maskDeterministicAsync } from './maskers/deterministic';
import { middlewares as _middlewares } from './middlewares';
import type { AutoMaskOptions, MaskOptions, MiddlewareOptions, Paths } from './utils';
import { getMaskMetadata } from './decorators/mask';
import { registry as _registry } from './core/registry';
import { graphqlMask } from './graphql';

// Populate the process-wide registry with the built-in maskers.
registerDefaults();

export { Mask, getMaskMetadata } from './decorators';
export {
  createMaskStream,
  MaskifyStream,
  type MaskStreamOptions,
} from './stream';
export { defineConfig, GlobalConfigLoader } from './utils/config';
export { MaskifyError, MaskifyConfigError, MaskifyValidationError } from './utils/errors';
export { MaskerRegistry, registry } from './core/registry';
export type { AutoMaskOptions, MaskOptions, MiddlewareOptions, Paths };

// Expose Zod integration (Zod is an optional dependency)
export { zodMask, zodMaskField } from './zod';

// Expose GraphQL integration
export { graphqlMask } from './graphql';

export type MaskifyServerType = 'express' | 'fastify';

function collectMaskMetadata(instance: object): Record<string, MaskOptions> | null {
  let proto: object | null = Object.getPrototypeOf(instance);
  let merged: Record<string, MaskOptions> | null = null;
  while (proto && proto !== Object.prototype) {
    const meta = getMaskMetadata(proto);
    if (meta) {
      merged = { ...(meta as Record<string, MaskOptions>), ...(merged || {}) };
    }
    proto = Object.getPrototypeOf(proto);
  }
  return merged;
}

export namespace Maskify {
  export const mask = MaskifyCore.mask;
  export const maskAsync = MaskifyCore.maskAsync;

  export const pattern = MaskifyCore.pattern;

  export const maskSensitiveFields = MaskifyCore.maskSensitiveFields;
  export const maskSensitiveFieldsAsync = MaskifyCore.maskSensitiveFieldsAsync;

  export const deterministic = maskDeterministic;
  export const deterministicAsync = maskDeterministicAsync;

  export const autoMask = MaskifyCore.autoMask;
  export const autoMaskAsync = MaskifyCore.autoMaskAsync;

  export const smart = SmartMasker.process;
  export const middlewares = _middlewares;
  export const registry = _registry;
  export const graphql = graphqlMask;

  /**
   * Returns a new instance with all `@Mask`-decorated properties replaced by
   * their masked representation. Walks the prototype chain so decorators on
   * base classes are respected.
   */
  export function maskClass<T extends object>(instance: T): T {
    if (!instance || typeof instance !== 'object') return instance;

    const metadata = collectMaskMetadata(instance);
    if (!metadata) return instance;

    const proto = Object.getPrototypeOf(instance);
    const clone = Object.assign(Object.create(proto || null), instance) as T;

    for (const key of Object.keys(metadata)) {
      const current = (clone as any)[key];
      if (current !== undefined && current !== null) {
        (clone as any)[key] = MaskifyCore.mask(String(current), metadata[key]);
      }
    }

    return clone;
  }

  /**
   * Asynchronous version of maskClass.
   */
  export async function maskClassAsync<T extends object>(instance: T): Promise<T> {
    if (!instance || typeof instance !== 'object') return instance;

    const metadata = collectMaskMetadata(instance);
    if (!metadata) return instance;

    const proto = Object.getPrototypeOf(instance);
    const clone = Object.assign(Object.create(proto || null), instance) as T;

    for (const key of Object.keys(metadata)) {
      const current = (clone as any)[key];
      if (current !== undefined && current !== null) {
        (clone as any)[key] = await MaskifyCore.maskAsync(String(current), metadata[key]);
      }
    }

    return clone;
  }

  export function use(
    app: ExpressApp,
    options: MiddlewareOptions,
    type?: 'express',
  ): void;
  export function use(
    app: FastifyInstance,
    options: MiddlewareOptions,
    type: 'fastify',
  ): void;
  export function use(
    app: ExpressApp | FastifyInstance,
    options: MiddlewareOptions,
    type: MaskifyServerType = 'express',
  ): void {
    if (type === 'express') {
      (app as ExpressApp).use(middlewares.express(options));
      return;
    }
    if (type === 'fastify') {
      (app as FastifyInstance).register(middlewares.fastify, options);
      return;
    }
    throw new Error(`Unsupported server type: ${type as string}`);
  }
}
