import { Application, NextFunction } from 'express';
import type { MaskOptions, MiddlewareOptions } from './utils';

/**
 * Core Maskify utility class for masking sensitive data.
 */
export declare class Maskify {
  /**
   * Mask an individual string value.
   *
   * @example
   * Maskify.mask('john.doe@example.com', { type: 'email' });
   */
  static mask(value: string, opts?: MaskOptions): string;

  /**
   * Mask fields in an object or array using a schema.
   *
   * @example
   * Maskify.maskSensitiveFields(user, { email: { type: 'email' } });
   */
  static maskSensitiveFields<T extends object>(
    data: T | T[],
    schema: Record<string, MaskOptions>
  ): T | T[];

  /**
   * Apply a custom masking pattern.
   *
   * @example
   * Maskify.pattern('1234567890123456', '#### **** **** ####');
   */
  static pattern(value: string, pattern: string, opts?: MaskOptions): string;

  /**
   * Dynamically attach the Maskify middleware to an Express app.
   *
   * @example
   * await Maskify.use(app, { fields: ['email', 'phone'] });
   */
  static use(app: Application, options: MiddlewareOptions): Promise<void>;

  /**
   * Built-in middleware for Express.
   *
   * @example
   * Maskify.use(app, {});
   */
  static middlewares: {
    express(
      options: MiddlewareOptions
    ): (req: Request, res: Response, next: NextFunction) => void;
  };
}

export default Maskify;
