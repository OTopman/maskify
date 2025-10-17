import express from 'express';
import { MaskifyCore } from './core/maskify';
import { middlewares as _middlewares } from './middlewares';
import { MiddlewareOptions } from './utils';

/**
 * Namespace for additional utilities
 * Here we attach `use()` to integrate middleware in Express
 */
export namespace Maskify {
  export const mask = MaskifyCore.mask;
  export const pattern = MaskifyCore.pattern;
  export const maskSensitiveFields = MaskifyCore.maskSensitiveFields;

  export const middlewares = {
    express: _middlewares.express,
  };
  /**
   * Attach Maskify middleware to a server instance
   * @param app Express app
   * @param options MiddlewareOptions (fields, patterns, etc.)
   * @param type 'express' (default: 'express')
   */
  export const use = (
    app: express.Express,
    options: MiddlewareOptions,
    type: 'express' = 'express'
  ) => {
    if (type === 'express') {
      const mw = middlewares.express(options);
      app.use(mw);
    } else {
      throw new Error(`Unimplemented server type: ${type}`);
    }
  };
}
