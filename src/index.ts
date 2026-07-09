import type { Application as ExpressApp } from 'express';
import type { FastifyInstance } from 'fastify';
import { registerDefaults } from './core/bootstrap';
import { MaskifyCore } from './core/maskify';
import { registry as _registry } from './core/registry';
import { SmartMasker } from './core/textscan';
import { getMaskMetadata } from './decorators/mask';
import { graphqlMask } from './graphql';
import { maskDeterministic, maskDeterministicAsync } from './maskers/deterministic';
import { middlewares as _middlewares } from './middlewares';
import type { AutoMaskOptions, MaskOptions, MiddlewareOptions, Paths } from './utils';

import { InferMasker, object as schemaObject } from './core/schema';
import { maskAddress as schemaAddress } from './maskers/address';
import { maskCard as schemaCard } from './maskers/card';
import { maskDeterministic as schemaDeterministic, maskDeterministicAsync as schemaDeterministicAsync } from './maskers/deterministic';
import { maskEmail as schemaEmail } from './maskers/email';
import { maskGeneric as schemaGeneric } from './maskers/generic';
import { maskIp as schemaIp } from './maskers/ip';
import { maskJwt as schemaJwt } from './maskers/jwt';
import { maskName as schemaName } from './maskers/name';
import { maskPattern as schemaPattern } from './maskers/pattern';
import { maskPhone as schemaPhone } from './maskers/phone';
import { maskUrl as schemaUrl } from './maskers/url';

// Populate the process-wide registry with the built-in maskers.
registerDefaults();

export { MaskerRegistry, registry } from './core/registry';
export { getMaskMetadata, Mask } from './decorators';
export {
  createMaskStream,
  MaskifyStream,
  type MaskStreamOptions
} from './stream';
export { defineConfig, GlobalConfigLoader } from './utils/config';
export { MaskifyConfigError, MaskifyError, MaskifyValidationError } from './utils/errors';
export type { AutoMaskOptions, MaskOptions, MiddlewareOptions, Paths };

  export { createMasker, type MaskContext, type Masker } from './core/masker';
  export { object, ObjectMasker, type ObjectMaskerCallable } from './core/schema';
  export { maskAddress, type AddressOptions } from './maskers/address';
  export { maskCard, type CardOptions } from './maskers/card';
  export { maskDeterministic, maskDeterministicAsync, type DeterministicOptions } from './maskers/deterministic';
  export { maskEmail, type EmailOptions } from './maskers/email';
  export { maskGeneric, type GenericOptions } from './maskers/generic';
  export { maskIp, type IpOptions } from './maskers/ip';
  export { maskJwt, type JwtOptions } from './maskers/jwt';
  export { maskName, type NameOptions } from './maskers/name';
  export { maskPattern, type PatternOptions } from './maskers/pattern';
  export { maskPhone, type PhoneOptions } from './maskers/phone';
  export { maskUrl, type UrlOptions } from './maskers/url';

export const m = {
  object: schemaObject,
  email: schemaEmail,
  card: schemaCard,
  phone: schemaPhone,
  deterministic: schemaDeterministic,
  deterministicAsync: schemaDeterministicAsync,
  address: schemaAddress,
  ip: schemaIp,
  jwt: schemaJwt,
  name: schemaName,
  url: schemaUrl,
  generic: schemaGeneric,
  pattern: schemaPattern,
};

export namespace m {
  export type infer<T> = InferMasker<T>;
}

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
