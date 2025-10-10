import { maskCard, maskEmail, maskGeneric, maskPhone } from './maskers';
import { Detectors, MaskableType, MaskOptions, safeClone } from './utils';

export class Maskify {
  static mask(
    value: string,
    opts: MaskOptions = { maskChar: '*', maxAsterisks: 4, autoDetect: true }
  ): string {
    if (!value) return value;
    const trimmed = value.trim();
    const { autoDetect = true, type } = opts;

    if (type) return this.maskByType(trimmed, type, opts);

    if (autoDetect) {
      if (Detectors.isEmail(trimmed)) return maskEmail(trimmed, opts);
      if (Detectors.isPhone(trimmed)) return maskPhone(trimmed, opts);
      if (Detectors.isCard(trimmed)) return maskCard(trimmed, opts);
    }

    return maskGeneric(trimmed, opts);
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
      default:
        return maskGeneric(value, opts);
    }
  }

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
            current[key] = this.mask(current[key], opts);
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
