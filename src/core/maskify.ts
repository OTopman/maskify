import {
  maskAddress,
  maskCard,
  maskDeterministic,
  maskEmail,
  maskGeneric,
  maskIp,
  maskJwt,
  maskName,
  maskPattern,
  maskPhone,
  maskUrl,
} from '../maskers';
import {
  Detectors,
  GlobalConfigLoader,
  MaskableType,
  MaskOptions,
  MaskSchemaOptions,
  safeClone,
} from '../utils';
import { applyAllowStrategy } from './strategies/allow-strategy';
import { applyAutoStrategy, AutoMaskOptions } from './strategies/auto-strategy';
import { applyMaskStrategy } from './strategies/mask-strategy';

export class MaskifyCore {
  /**
   * Helper to merge user options with global config
   */
  private static getEffectiveOptions(opts: MaskOptions = {}): MaskOptions {
    const globalDefaults = GlobalConfigLoader.load().maskOptions || {};
    // User options take precedence over global defaults
    return { ...globalDefaults, ...opts };
  }

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

  private static maskByType(
    value: string,
    type: MaskableType,
    opts: MaskOptions
  ) {
    switch (type) {
      case 'email':
        return maskEmail(value, opts);
      case 'phone':
        return maskPhone(value, opts);
      case 'card':
        return maskCard(value, opts);
      case 'address':
        return maskAddress(value, opts);
      case 'name':
        return maskName(value, opts);
      case 'ip':
        return maskIp(value);
      case 'jwt':
        return maskJwt(value, opts);
      case 'url':
        return maskUrl(value, opts);
      case 'generic':
      default:
        if ((opts as any).secret) return maskDeterministic(value, opts as any);
        return maskGeneric(value, opts);
    }
  }

  /**
   * Mask fields in nested object/array based on schema.
   * schema: Record<path, MaskOptions>
   *
   * Supports:
   * - dot paths: 'user.email'
   * - array wildcard: 'users[*].email'
   * - numeric indices: 'cards[0].number'
   */
  static maskSensitiveFields<T extends object>(
    data: T | T[],
    schema: Record<string, MaskOptions>,
    options?: MaskSchemaOptions
  ): T | T[] {
    const clone = safeClone<T | T[]>(data);
    const globalConfig = GlobalConfigLoader.load();

    // Determine Mode: User Arg > Config File > Default 'mask'
    const mode = options?.mode || globalConfig.mode || 'mask';

    // Determine Default Mask Options
    const defaultMask = {
      ...(globalConfig.maskOptions || {}),
      ...(options?.defaultMask || {}),
    };

    if (mode === 'allow') {
      applyAllowStrategy(clone, schema, defaultMask);
    } else {
      applyMaskStrategy(clone, schema);
    }

    return clone;
  }
}
