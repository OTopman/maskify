import fs from 'fs';
import path from 'path';
import { MaskifyConfigError } from './errors';
import type {
  AutoMaskOptions,
  MaskOptions,
  MiddlewareField,
  MiddlewareOptions,
} from './types';

export interface GlobalConfig extends MiddlewareOptions {
  /** Disable internal caching for paths and regexes (saves memory, costs CPU). */
  disableCache?: boolean;

  /** Default mode applied to `maskSensitiveFields` when not overridden per call. */
  mode?: 'mask' | 'allow';
}

const CONFIG_FILES = [
  'maskify.config.js',
  'maskify.config.cjs',
  'maskify.config.ts',
  '.maskifyrc.js',
  '.maskifyrc.json',
  '.maskifyrc',
];

/**
 * Type-safe helper to define Maskify configuration in config files.
 * Narrows the return type so IDE autocomplete works inside the object literal.
 */
export function defineConfig(config: GlobalConfig): GlobalConfig {
  return config;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeField(input: unknown): MiddlewareField | null {
  if (typeof input === 'string') return input;
  if (!isRecord(input) || typeof input.name !== 'string') return null;
  return {
    name: input.name,
    options: isRecord(input.options)
      ? (input.options as MaskOptions)
      : undefined,
  };
}

/**
 * Validates + narrows arbitrary config input into GlobalConfig shape.
 * Silently drops unknown keys rather than throwing, so a typo in a config
 * file can't crash an app at startup.
 */
export function validateConfig(raw: unknown): GlobalConfig {
  if (!isRecord(raw)) return {};

  const config: GlobalConfig = {};

  if (raw.mode === 'mask' || raw.mode === 'allow') {
    config.mode = raw.mode;
  }

  if (typeof raw.disableCache === 'boolean') {
    config.disableCache = raw.disableCache;
  }

  if (Array.isArray(raw.fields)) {
    const fields = raw.fields
      .map(normalizeField)
      .filter((f): f is MiddlewareField => f !== null);
    if (fields.length > 0) config.fields = fields;
  }

  if (isRecord(raw.maskOptions)) {
    config.maskOptions = raw.maskOptions as AutoMaskOptions;
  }

  return config;
}

export class ConfigLoader {
  private static cached: GlobalConfig | null = null;

  static load(options: { strict?: boolean } = {}): GlobalConfig {
    if (this.cached) return this.cached;
    const { strict = false } = options;

    try {
      const cwd = process.cwd();

      for (const file of CONFIG_FILES) {
        const filePath = path.join(cwd, file);
        if (!fs.existsSync(filePath)) continue;

        let raw: unknown;
        if (file.endsWith('.js') || file.endsWith('.cjs') || file.endsWith('.ts')) {
          const loaded = require(filePath);
          raw = loaded?.default ?? loaded;
        } else {
          raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }

        this.cached = validateConfig(raw);
        return this.cached;
      }

      const pkgPath = path.join(cwd, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        if (pkg.maskify) {
          this.cached = validateConfig(pkg.maskify);
          return this.cached;
        }
      }
    } catch (error) {
      if (strict) {
        throw new MaskifyConfigError(
          'Failed to load maskify configuration',
          'Check syntax in maskify config files or package.json maskify field',
          { cause: error instanceof Error ? error.message : String(error) },
        );
      }
    }

    this.cached = {};
    return this.cached;
  }

  static reload(): GlobalConfig {
    this.cached = null;
    return this.load();
  }
}

export const GlobalConfigLoader = ConfigLoader;
