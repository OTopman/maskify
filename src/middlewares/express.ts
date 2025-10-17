import type { NextFunction, Request, Response } from 'express';
import { MaskifyCore } from '../core/maskify';
import { MiddlewareOptions } from '../utils';

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

export function express(options: MiddlewareOptions) {
  // Ensure Express is available
  ensureExpressInstalled();

  const { fields, maskOptions: globalOptions } = options;

  return (_: Request, res: Response, next: NextFunction) => {
    // Preserve original `res.json`
    const originalJson = res.json.bind(res);

    res.json = (data: any) => {
      if (!data || typeof data !== 'object') return originalJson(data);

      // Build schema dynamically from `fields`
      const schema = Object.fromEntries(
        fields.map((f) => {
          if (typeof f === 'string') {
            // string → use global maskOptions
            return [f, globalOptions || {}];
          }

          // object → merge field maskOptions with global defaults
          return [
            f.name,
            {
              ...(globalOptions || {}),
              ...(f.options || {}),
            },
          ];
        })
      );

      const masked = MaskifyCore.maskSensitiveFields(data, schema);

      return originalJson(masked);
    };

    next();
  };
}
