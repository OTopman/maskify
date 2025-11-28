import { MaskifyCore } from '../maskify';
import { MaskOptions } from '../../utils';
import { splitPath } from '../../utils/paths';

/**
 * Applies masking to specific paths defined in the schema (Blocklist).
 */
export function applyMaskStrategy(
  target: any,
  schema: Record<string, MaskOptions>
): void {
  const applyPath = (obj: any, path: string, opts: MaskOptions) => {
    const segments = splitPath(path);

    const recurse = (current: any, i: number): void => {
      if (current == null) return;
      const key = segments[i];
      const isLast = i === segments.length - 1;

      // Handle Wildcards (*)
      if (key === '*') {
        if (Array.isArray(current)) {
          for (const item of current) recurse(item, i + 1);
        } else if (typeof current === 'object') {
          for (const k in current) recurse(current[k], i + 1);
        }
        return;
      }

      // Handle Numeric Indices
      if (!isNaN(Number(key))) {
        const idx = Number(key);
        if (Array.isArray(current) && current[idx] != null) {
          recurse(current[idx], i + 1);
        }
        return;
      }

      // Handle Object Keys
      if (!(key in current)) return;

      if (isLast) {
        if (typeof current[key] === 'string') {
          current[key] = MaskifyCore.mask(current[key], opts);
        }
      } else {
        recurse(current[key], i + 1);
      }
    };

    recurse(obj, 0);
  };

  for (const [path, opts] of Object.entries(schema)) {
    applyPath(target, path, opts);
  }
}
