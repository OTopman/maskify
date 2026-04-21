import 'reflect-metadata';

import type { Application as ExpressApp } from 'express';
import type { FastifyInstance } from 'fastify';
import { registerDefaults } from './core/bootstrap';
import { SmartMasker } from './core/compiler';
import { MaskifyCore } from './core/maskify';
import { maskDeterministic } from './maskers/deterministic';
import { middlewares as _middlewares } from './middlewares';
import type { AutoMaskOptions, MaskOptions, MiddlewareOptions } from './utils';
import { MASK_METADATA_KEY } from './decorators/mask';

// Populate the process-wide registry with the built-in maskers.
registerDefaults();

export { Mask } from './decorators';
export {
  createMaskStream,
  MaskifyStream,
  type MaskStreamOptions,
} from './stream';
export { defineConfig, GlobalConfigLoader } from './utils/config';
export { MaskifyError, MaskifyConfigError, MaskifyValidationError } from './utils/errors';
export { MaskerRegistry } from './core/registry';
export type { AutoMaskOptions, MaskOptions, MiddlewareOptions };

export type MaskifyServerType = 'express' | 'fastify';

function collectMaskMetadata(instance: object): Record<string, MaskOptions> | null {
  let proto: object | null = Object.getPrototypeOf(instance);
  let merged: Record<string, MaskOptions> | null = null;
  while (proto && proto !== Object.prototype) {
    const meta = Reflect.getMetadata(MASK_METADATA_KEY, proto);
    if (meta) {
      merged = { ...(meta as Record<string, MaskOptions>), ...(merged || {}) };
    }
    proto = Object.getPrototypeOf(proto);
  }
  return merged;
}

export namespace Maskify {
  export const mask = MaskifyCore.mask;
  export const pattern = MaskifyCore.pattern;
  export const maskSensitiveFields = MaskifyCore.maskSensitiveFields;
  export const deterministic = maskDeterministic;
  export const autoMask = MaskifyCore.autoMask;
  export const smart = SmartMasker.process;
  export const middlewares = _middlewares;

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
