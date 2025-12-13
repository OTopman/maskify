import { maskDeterministic, maskGeneric, maskPattern } from '../maskers';
import {
  Detectors,
  GlobalConfigLoader,
  MaskableType,
  MaskOptions,
  MaskSchemaOptions,
  safeClone,
} from '../utils';
import { registry } from './registry';
import { applyAllowStrategy } from './strategies/allow-strategy';
import { applyAutoStrategy, AutoMaskOptions } from './strategies/auto-strategy';
import { applyMaskStrategy } from './strategies/mask-strategy';

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
    const { autoDetect = true, type } = options;

    if (!value) return value;
    const trimmed = value.trim();
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
   * Pattern-based masking helper.
   * Supports:
   *  - '#' reveal char
   *  - '*' mask char (opts.maskChar)
   *  - '{n}' repeat expansion for previous symbol
   * Fault-tolerant: will append masked tail if value longer than pattern.
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
  ) {
    const masker = registry.get(type);
    if (masker) {
      return masker(value, opts);
    }
    if ((opts as any).secret) return maskDeterministic(value, opts as any);

    return maskGeneric(value, opts);
  }

  /**
   * Mask fields in nested object/array based on schema.
   *
   * Supports:
   * - dot paths: 'user.email'
   * - array wildcard: 'users[*].email'
   * - numeric indices: 'cards[0].number'
   *
   * @param data - The object or array to mask.
   * @param schema - Map of paths to mask options (e.g. { 'user.email': { type: 'email' } })
   * @param options - Configuration for the schema application (mode, defaultMask).
   * @param configOverride - Optional global config injection.
   */
  static maskSensitiveFields<T extends object>(
    data: T | T[],
    schema: Record<string, MaskOptions>,
    options?: MaskSchemaOptions,
    configOverride?: MaskOptions
  ): T | T[] {
    const clone = safeClone<T | T[]>(data);
    // Load config via our helper (which handles DI and loading)
    const globalConfig = GlobalConfigLoader.load();
    const globalMaskOpts = configOverride || globalConfig.maskOptions || {};

    // Determine Mode
    const mode = options?.mode || globalConfig.mode || 'mask';

    // Determine Default Mask Options
    const defaultMask = {
      ...globalMaskOpts,
      ...(options?.defaultMask || {}),
    };

    const maskCallback = (val: string, fieldOpts: MaskOptions) => {
      // We merge fieldOpts with global defaults inside MaskifyCore.mask
      return MaskifyCore.mask(val, { ...globalMaskOpts, ...fieldOpts });
    };

    if (mode === 'allow') {
      applyAllowStrategy(clone, schema, defaultMask, maskCallback);
    } else {
      applyMaskStrategy(clone, schema, maskCallback);
    }

    return clone;
  }
}
