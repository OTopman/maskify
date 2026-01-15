import type { NextFunction, Request, Response } from 'express';
import { MaskifyCore } from '../core/maskify';
import { MiddlewareOptions } from '../utils';
import { GlobalConfigLoader } from '../utils/config'; // 👈 Import Loader

let expressLoaded = false;
function ensureExpressInstalled() {
  if (expressLoaded) return;
  try {
    require.resolve('express');
    expressLoaded = true;
  } catch {
    throw new Error(
      'Express is required but not installed. Please run `npm install express`.'
    );
  }
}

export function express(options?: MiddlewareOptions) {
  ensureExpressInstalled();

  // 1. Resolve Config (Param > File > Empty)
  const config = options || GlobalConfigLoader.load();
  const { fields, maskOptions: globalOptions } = config;

  let schema: Record<string, any> | null = null;

  if (fields && fields.length > 0) {
    schema = Object.fromEntries(
      fields.map((f) => {
        if (typeof f === 'string') {
          return [f, globalOptions || {}];
        }
        return [
          f.name,
          {
            ...(globalOptions || {}),
            ...(f.options || {}),
          },
        ];
      })
    );
  }

  return (_: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = (data: any) => {
      if (!data || typeof data !== 'object') return originalJson(data);

      let masked;
      if (schema) {
        masked = MaskifyCore.maskSensitiveFields(data, schema);
      } else {
        // Fallback to Auto-Masking if no fields defined
        masked = MaskifyCore.autoMask(data, globalOptions);
      }

      return originalJson(masked);
    };

    next();
  };
}