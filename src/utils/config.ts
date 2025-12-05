import fs from 'fs';
import path from 'path';
import { MaskOptions } from './types';

export interface GlobalConfig {
  /** Global mask options applied to all mask calls */
  maskOptions?: MaskOptions;
  /** Default fields to mask (used by CLI/Middleware) */
  fields?: string[];

  /** Disable internal caching for paths and regexes (saves memory, costs CPU) */
  disableCache?: boolean;

  /** Default mode (allow/mask) */
  mode?: 'mask' | 'allow';
}

const CONFIG_FILES = [
  'maskify.config.js',
  '.maskifyrc.js',
  '.maskifyrc.json',
  '.maskifyrc',
];

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
          if (file.endsWith('.js')) {
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
      // Fail silently and use defaults if FS access fails (e.g. strict environments)
    }

    this.config = {};
    return this.config!;
  }

  /**
   * Force reload (useful for tests)
   */
  static reload() {
    this.config = null;
    return this.load();
  }
}

export const GlobalConfigLoader = ConfigLoader;
