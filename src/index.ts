import express from 'express';
import { FastifyInstance } from 'fastify';
import { SmartMasker } from './core/compiler';
import { MaskifyCore } from './core/maskify';
import { maskDeterministic } from './maskers';
import { middlewares as _middlewares } from './middlewares';
import { MiddlewareOptions } from './utils';

// --- Exports for TypeDoc ---
export { Mask } from './decorators';
export { createMaskStream, MaskifyStream, type MaskStreamOptions } from './stream';
export { type AutoMaskOptions } from './core/strategies/auto-strategy';
export * from './utils/types'; // Exports MaskOptions, MaskSchemaOptions, MiddlewareOptions

/**
 * Namespace for additional utilities
 * Here we attach `use()` to integrate middleware in Express
 */
export namespace Maskify {
  export const mask = MaskifyCore.mask;
  export const pattern = MaskifyCore.pattern;
  export const maskSensitiveFields = MaskifyCore.maskSensitiveFields;
  export const deterministic = maskDeterministic;
  export const autoMask = MaskifyCore.autoMask;

  /**
   * Smartly detects and masks sensitive data within unstructured text
   * (logs, paragraphs, error messages) using a compiler-style lexer.
   */
  export const smart = SmartMasker.process;

  export const middlewares = _middlewares;

  /**
   * Helper to apply masking to a class instance based on `@Mask` decorators.
   */
  export function maskClass<T extends object>(instance: T): T {
    // Lazy load metadata key to avoid circular deps if defined elsewhere
    const MASK_METADATA_KEY = Symbol.for('MASK_METADATA');

    const proto = Object.getPrototypeOf(instance);
    if (!proto) return instance;

    const metadata = Reflect.getMetadata(MASK_METADATA_KEY, proto);
    if (!metadata) return instance;

    const clone = Object.assign(Object.create(proto), instance);
    for (const key of Object.keys(metadata)) {
      if (clone[key]) {
        clone[key] = Maskify.mask(clone[key], metadata[key]);
      }
    }

    return clone;
  }

  /**
   * Attach Maskify middleware to a server instance
   * @param app Express app
   * @param options MiddlewareOptions (fields, patterns, etc.)
   * @param type 'express' (default: 'express')
   */
  export const use = (
    app: any | FastifyInstance | express.Application,
    options: MiddlewareOptions,
    type: 'express' | 'fastify' = 'express'
  ) => {
    if (type === 'express') {
      const mw = middlewares.express(options);
      app.use(mw);
    } else if (type === 'fastify') {
      app.register(middlewares.fastify, options);
    } else {
      throw new Error(`Unimplemented server type: ${type}`);
    }
  };
}