import {
  maskAddress,
  maskCard,
  maskEmail,
  maskGeneric,
  maskName,
  maskPattern,
  maskPhone,
} from '../maskers';
import { Detectors, MaskableType, MaskOptions, safeClone } from '../utils';

export class MaskifyCore {
  static mask(
    value: string,
    opts: MaskOptions = { maskChar: '*', maxAsterisks: 4, autoDetect: true }
  ): string {
    if (!value) return value;
    const trimmed = value.trim();
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
      case 'generic':
      default:
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
    schema: Record<string, MaskOptions>
  ): T | T[] {
    const clone = safeClone<T | T[]>(data);

    // 🧠 Normalize paths like [*] → .*, [0] → .0
    const normalizePath = (path: string) =>
      path
        .replace(/\[(\*|\d+)\]/g, '.$1') // convert [*] or [0]
        .replace(/\.{2,}/g, '.') // collapse double dots
        .replace(/^\./, '') // remove leading dot
        .replace(/\.$/, ''); // remove trailing dot

    const applyMask = (target: any, path: string, opts: MaskOptions) => {
      const normalizedPath = normalizePath(path);
      const segments = normalizedPath.split('.').filter(Boolean);

      const recurse = (current: any, i: number): void => {
        if (current == null) return;
        const key = segments[i];
        const isLast = i === segments.length - 1;

        // wildcard *
        if (key === '*') {
          if (Array.isArray(current)) {
            for (const item of current) recurse(item, i + 1);
          }
          return;
        }

        // numeric index e.g. users[0]
        if (!isNaN(Number(key))) {
          const idx = Number(key);
          if (Array.isArray(current) && current[idx] != null) {
            recurse(current[idx], i + 1);
          }
          return;
        }

        // normal object key
        if (!(key in current)) return;

        if (isLast) {
          if (typeof current[key] === 'string') {
            current[key] = MaskifyCore.mask(current[key], opts);
          }
        } else {
          recurse(current[key], i + 1);
        }
      };

      recurse(target, 0);
    };

    for (const [path, opts] of Object.entries(schema)) {
      applyMask(clone, path, opts);
    }

    return clone;
  }
}
