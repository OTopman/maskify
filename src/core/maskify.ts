import { maskGeneric, maskPattern } from '../maskers';
import {
  AutoMaskOptions,
  Detectors,
  GlobalConfigLoader,
  MaskableType,
  MaskOptions,
  MaskSchemaOptions,
  Paths,
  safeClone,
} from '../utils';
import { registry } from './registry';
import { applyAllowStrategy, applyAllowStrategyAsync } from './strategies/allow-strategy';
import { applyAutoStrategy, applyAutoStrategyAsync } from './strategies/auto-strategy';
import { applyMaskStrategy, applyMaskStrategyAsync } from './strategies/mask-strategy';

export class MaskifyCore {
  /**
   * Helper to merge provided options with global configuration.
   * @param opts - Per-call options.
   * @param config - Optional global config override (dependency injection).
   */
  private static getEffectiveOptions(
    opts: MaskOptions = {},
    configOverride?: MaskOptions
  ): MaskOptions {
    const globalDefaults =
      configOverride || GlobalConfigLoader.load().maskOptions || {};
    return { ...globalDefaults, ...opts };
  }

  /**
   * Masks a single value based on the provided options.
   * @param value - The string to mask.
   * @param opts - Masking options.
   */
  static mask(value: string, opts?: MaskOptions): string {
    // Merge defaults
    const options = MaskifyCore.getEffectiveOptions(opts);

    if (options.condition && !options.condition(value, options.context)) {
      return value;
    }

    if (!value) return value;
    const trimmed = value.trim();

    if (options.redact) {
      if (options.label) return options.label;
      const { autoDetect = true, type } = options;
      const currentType = type || (autoDetect ? Detectors.detectType(trimmed) : 'generic');
      const labelType = currentType === 'generic' ? 'REDACTED' : `REDACTED_${currentType.toUpperCase()}`;
      return `[${labelType}]`;
    }

    const { autoDetect = true, type } = options;

    if (options.transform) {
      return options.transform(trimmed);
    }

    // If pattern exists, it takes the highest precedence
    if (options.pattern) return maskPattern(trimmed, options.pattern, opts);

    if (type) return MaskifyCore.maskByType(trimmed, type, options);

    // If autoDetect → infer type using detectors
    if (autoDetect) {
      const inferredType = Detectors.detectType(trimmed);
      return MaskifyCore.maskByType(trimmed, inferredType, options);
    }

    return maskGeneric(trimmed, options);
  }

  /**
   * Masks a single value asynchronously (supports async custom/deterministic maskers).
   */
  static async maskAsync(value: string, opts?: MaskOptions): Promise<string> {
    const options = MaskifyCore.getEffectiveOptions(opts);

    if (options.condition && !options.condition(value, options.context)) {
      return value;
    }

    if (!value) return value;
    const trimmed = value.trim();

    if (options.redact) {
      if (options.label) return options.label;
      const { autoDetect = true, type } = options;
      const currentType = type || (autoDetect ? Detectors.detectType(trimmed) : 'generic');
      const labelType = currentType === 'generic' ? 'REDACTED' : `REDACTED_${currentType.toUpperCase()}`;
      return `[${labelType}]`;
    }

    const { autoDetect = true, type } = options;

    if (options.transform) {
      return options.transform(trimmed);
    }

    if (options.pattern) return maskPattern(trimmed, options.pattern, opts);

    if (type) {
      return MaskifyCore.maskByTypeAsync(trimmed, type, options);
    }

    if (autoDetect) {
      const inferredType = Detectors.detectType(trimmed);
      return MaskifyCore.maskByTypeAsync(trimmed, inferredType, options);
    }

    return maskGeneric(trimmed, options);
  }

  static autoMask<T extends object>(data: T[], options?: AutoMaskOptions): T[];
  static autoMask<T extends object>(data: T, options?: AutoMaskOptions): T;
  static autoMask<T extends object>(
    data: T | T[],
    options?: AutoMaskOptions
  ): T | T[] {
    const globalConfig = GlobalConfigLoader.load();
    const globalMaskOpts = globalConfig.maskOptions || {};

    // Merge: User Options > Global Config > Defaults
    const effectiveOptions: AutoMaskOptions = {
      ...globalMaskOpts,
      ...options,
    };

    const clone = safeClone<T | T[]>(data);

    if (Array.isArray(clone)) {
      clone.forEach((item) => applyAutoStrategy(item, effectiveOptions));
    } else {
      applyAutoStrategy(clone, effectiveOptions);
    }

    return clone;
  }

  /**
   * Asynchronous auto-masking strategy.
   */
  static autoMaskAsync<T extends object>(data: T[], options?: AutoMaskOptions): Promise<T[]>;
  static autoMaskAsync<T extends object>(data: T, options?: AutoMaskOptions): Promise<T>;
  static async autoMaskAsync<T extends object>(
    data: T | T[],
    options?: AutoMaskOptions
  ): Promise<T | T[]> {
    const globalConfig = GlobalConfigLoader.load();
    const globalMaskOpts = globalConfig.maskOptions || {};

    const effectiveOptions: AutoMaskOptions = {
      ...globalMaskOpts,
      ...options,
    };

    const clone = safeClone<T | T[]>(data);

    if (Array.isArray(clone)) {
      for (const item of clone) {
        await applyAutoStrategyAsync(item, effectiveOptions);
      }
    } else {
      await applyAutoStrategyAsync(clone, effectiveOptions);
    }

    return clone;
  }

  /**
   * Pattern-based masking helper.
   */
  static pattern(
    value: unknown,
    pattern: string,
    option: Pick<MaskOptions, 'maskChar'> = {}
  ) {
    return maskPattern(value, pattern, option);
  }

  /**
   * Delegates masking to the registered handler.
   */
  private static maskByType(
    value: string,
    type: MaskableType,
    opts: MaskOptions
  ): string {
    const masker = registry.get(type);
    if (masker) {
      return masker(value, opts) as string;
    }
    return maskGeneric(value, opts);
  }

  /**
   * Delegates masking to the registered handler asynchronously.
   */
  private static async maskByTypeAsync(
    value: string,
    type: MaskableType,
    opts: MaskOptions
  ): Promise<string> {
    const masker = registry.get(type);
    if (masker) {
      return await masker(value, opts);
    }
    return maskGeneric(value, opts);
  }

  /**
   * Mask fields in nested object/array based on schema.
   */
  static maskSensitiveFields<T extends object>(
    data: T[],
    schema: Partial<Record<Paths<T[]> & string, MaskOptions>>,
    options?: MaskSchemaOptions,
    configOverride?: MaskOptions
  ): T[];
  static maskSensitiveFields<T extends object>(
    data: T,
    schema: Partial<Record<Paths<T> & string, MaskOptions>>,
    options?: MaskSchemaOptions,
    configOverride?: MaskOptions
  ): T;
  static maskSensitiveFields<T extends object>(
    data: T | T[],
    schema: Record<string, MaskOptions>,
    options?: MaskSchemaOptions,
    configOverride?: MaskOptions
  ): T | T[] {
    const clone = safeClone<T | T[]>(data);
    const globalConfig = GlobalConfigLoader.load();
    const globalMaskOpts = configOverride || globalConfig.maskOptions || {};

    const mode = options?.mode || globalConfig.mode || 'mask';

    const defaultMask = {
      ...globalMaskOpts,
      ...(options?.defaultMask || {}),
    };

    const maskCallback = (val: string, fieldOpts: MaskOptions) => {
      return MaskifyCore.mask(val, { ...globalMaskOpts, ...fieldOpts, context: options?.context });
    };

    if (mode === 'allow') {
      applyAllowStrategy(clone, schema, defaultMask, maskCallback);
    } else {
      applyMaskStrategy(clone, schema, maskCallback);
    }

    return clone;
  }

  /**
   * Asynchronous nested object masking.
   */
  static maskSensitiveFieldsAsync<T extends object>(
    data: T[],
    schema: Partial<Record<Paths<T[]> & string, MaskOptions>>,
    options?: MaskSchemaOptions,
    configOverride?: MaskOptions
  ): Promise<T[]>;
  static maskSensitiveFieldsAsync<T extends object>(
    data: T,
    schema: Partial<Record<Paths<T> & string, MaskOptions>>,
    options?: MaskSchemaOptions,
    configOverride?: MaskOptions
  ): Promise<T>;
  static async maskSensitiveFieldsAsync<T extends object>(
    data: T | T[],
    schema: Record<string, MaskOptions>,
    options?: MaskSchemaOptions,
    configOverride?: MaskOptions
  ): Promise<T | T[]> {
    const clone = safeClone<T | T[]>(data);
    const globalConfig = GlobalConfigLoader.load();
    const globalMaskOpts = configOverride || globalConfig.maskOptions || {};

    const mode = options?.mode || globalConfig.mode || 'mask';

    const defaultMask = {
      ...globalMaskOpts,
      ...(options?.defaultMask || {}),
    };

    const maskCallbackAsync = async (val: string, fieldOpts: MaskOptions) => {
      return MaskifyCore.maskAsync(val, { ...globalMaskOpts, ...fieldOpts, context: options?.context });
    };

    if (mode === 'allow') {
      await applyAllowStrategyAsync(clone, schema, defaultMask, maskCallbackAsync);
    } else {
      await applyMaskStrategyAsync(clone, schema, maskCallbackAsync);
    }

    return clone;
  }
}
