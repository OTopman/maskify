import fs from 'fs';
import path from 'path';
import { MaskOptions } from './types';

export interface MaskifyConfig {
  mode?: 'mask' | 'allow';
  fields?: string[];
  maskOptions?: MaskOptions;
}

const CONFIG_FILES = [
  'maskify.config.js',
  '.maskifyrc.js',
  '.maskifyrc.json',
  '.maskifyrc', // Assumed JSON
];

export function loadConfig(): MaskifyConfig {
  const cwd = process.cwd();

  // 1. Search for dedicated config files
  for (const file of CONFIG_FILES) {
    const filePath = path.join(cwd, file);
    if (fs.existsSync(filePath)) {
      try {
        // Handle JS files
        if (file.endsWith('.js')) {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const config = require(filePath);
          return config.default || config;
        }

        // Handle JSON files
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      } catch (error) {
        console.warn(
          `[Maskify] Warning: Failed to load config from ${file}`,
          error
        );
      }
    }
  }

  // 2. Check package.json
  const pkgPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (pkg.maskify) {
        return pkg.maskify;
      }
    } catch {
      // Ignore package.json errors
    }
  }

  return {};
}
