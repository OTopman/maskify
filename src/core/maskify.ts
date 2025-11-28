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
  MaskableType,
  MaskOptions,
  MaskSchemaOptions,
  safeClone,
} from '../utils';
import { applyAllowStrategy } from './strategies/allow-strategy';
import { applyMaskStrategy } from './strategies/mask-strategy';

export class MaskifyCore {
  static mask(
    value: string,
    opts: MaskOptions = { maskChar: '*', maxAsterisks: 4, autoDetect: true }
  ): string {
    if (!value) return value;
    const trimmed = value.trim();
    if (opts.transform) {
      return opts.transform(trimmed);
    }

    const { autoDetect = true, type } = opts;

    // If pattern exists, it takes the highest precedence
    if (opts.pattern) return maskPattern(trimmed, opts.pattern, opts);

    if (type) return MaskifyCore.maskByType(trimmed, type, opts);

    // If autoDetect → infer type using detectors
    if (autoDetect) {
      const inferredType = Detectors.detectType(trimmed);
      return MaskifyCore.maskByType(trimmed, inferredType, opts);
    }

    return maskGeneric(trimmed, opts);
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
    options: MaskSchemaOptions = { mode: 'mask' }
  ): T | T[] {
    const clone = safeClone<T | T[]>(data);

    if (options.mode === 'allow') {
      applyAllowStrategy(
        clone,
        schema,
        options.defaultMask || { type: 'generic' }
      );
    } else {
      applyMaskStrategy(clone, schema);
    }

    return clone;
  }
}
