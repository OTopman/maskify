import { MaskifyCore } from '../core/maskify';
import { MiddlewareOptions } from '../utils';
import type { NextFunction, Request, Response } from 'express';

export async function express(options: MiddlewareOptions) {
  await import('express').catch(() => {
    throw new Error('Express is required but not installed');
  });

  const { fields, maskOptions } = options;
  return (_: Request, res: Response, next: NextFunction) => {
    // Save original res.json
    const originalJson = res.json.bind(res);

    res.json = (data: any) => {
      // Mask specified fields in response
      const masked = MaskifyCore.maskSensitiveFields(
        data,
        Object.fromEntries(fields.map((f) => [f, maskOptions || {}]))
      );

      return originalJson(masked);
    };

    next();
  };
}
