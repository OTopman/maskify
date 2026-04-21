import type { NextFunction, Request, Response } from 'express';
import { MaskifyCore } from '../core/maskify';
import { MiddlewareOptions } from '../utils';
import { GlobalConfigLoader } from '../utils/config';
import { buildSchemaFromFields } from '../utils/schema-builder';

let expressVerified = false;
function ensureExpressInstalled() {
  if (expressVerified) return;
  try {
    require.resolve('express');
    expressVerified = true;
  } catch {
    throw new Error(
      'Express is required but not installed. Please run `npm install express`.',
    );
  }
}

export function express(options?: MiddlewareOptions) {
  ensureExpressInstalled();

  const config = options || GlobalConfigLoader.load();
  const { fields, maskOptions: globalOptions } = config;
  const schema = buildSchemaFromFields(fields, globalOptions);

  return (_req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = (data: unknown) => {
      if (!data || typeof data !== 'object') return originalJson(data);

      const masked = schema
        ? MaskifyCore.maskSensitiveFields(data as object, schema)
        : MaskifyCore.autoMask(data as object, globalOptions);

      return originalJson(masked);
    };

    next();
  };
}
