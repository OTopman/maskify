import fs from 'fs';
import path from 'path';
import { MaskOptions, MiddlewareOptions } from './types';

// Extend MiddlewareOptions to include global-specific settings
export interface GlobalConfig extends MiddlewareOptions {
  /** Disable internal caching for paths and regexes (saves memory, costs CPU) */
  disableCache?: boolean;

  /** Default mode (allow/mask) */
  mode?: 'mask' | 'allow';
}

const CONFIG_FILES = [
  'maskify.config.js',
  'maskify.config.ts', // Added TS support (requires ts-node usually, but useful for definition)
  '.maskifyrc.js',
  '.maskifyrc.json',
  '.maskifyrc',
];

/**
 * Type-safe helper to define Maskify configuration.
 */
export function defineConfig(config: GlobalConfig): GlobalConfig {
  return config;
}

class ConfigLoader {
  private static config: GlobalConfig | null = null;

  static load(): GlobalConfig {
    if (this.config) return this.config;

    try {
      const cwd = process.cwd();

      // 1. Search config files
      for (const file of CONFIG_FILES) {
        const filePath = path.join(cwd, file);
        if (fs.existsSync(filePath)) {
          if (file.endsWith('.js') || file.endsWith('.ts')) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const loaded = require(filePath);
            this.config = loaded.default || loaded;
            return this.config!;
          } else {
            const content = fs.readFileSync(filePath, 'utf-8');
            this.config = JSON.parse(content);
            return this.config!;
          }
        }
      }

      // 2. Check package.json
      const pkgPath = path.join(cwd, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        if (pkg.maskify) {
          this.config = pkg.maskify;
          return this.config!;
        }
      }
    } catch (error) {
      // Fail silently and use defaults
    }

    this.config = {};
    return this.config!;
  }

  static reload() {
    this.config = null;
    return this.load();
  }
}

export const GlobalConfigLoader = ConfigLoader;