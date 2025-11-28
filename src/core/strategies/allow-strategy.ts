import { MaskOptions } from '../../utils';
import { normalizePath } from '../../utils/paths';
import { MaskifyCore } from '../maskify';

/**
 * Masks everything EXCEPT the paths defined in the schema (Allowlist).
 */
export function applyAllowStrategy(
  target: any,
  schema: Record<string, MaskOptions>,
  defaultMask: MaskOptions
): void {
  // Pre-compile regexes for allowed paths
  const allowedRegexes = Object.keys(schema).map((path) => {
    const norm = normalizePath(path);
    // Escape dots and convert * to wildcard regex
    const regexStr =
      '^' + norm.replace(/\./g, '\\.').replace(/\*/g, '[^.]+') + '$';
    return new RegExp(regexStr);
  });

  const isAllowed = (path: string) =>
    allowedRegexes.some((regex) => regex.test(path));

  const traverse = (current: any, currentPath: string) => {
    if (!current || typeof current !== 'object') return;

    for (const key in current) {
      if (Object.prototype.hasOwnProperty.call(current, key)) {
        const val = current[key];
        const newPath = currentPath ? `${currentPath}.${key}` : key;

        if (val && typeof val === 'object') {
          // Arrays: traverse indices (items.0.id)
          if (Array.isArray(val)) {
            val.forEach((item, idx) => traverse(item, `${newPath}.${idx}`));
          } else {
            traverse(val, newPath);
          }
        } else {
          // Primitive: Check allowlist
          if (!isAllowed(newPath)) {
            // Mask strings OR numbers/booleans by converting to string
            if (['string', 'number', 'boolean'].includes(typeof val)) {
              current[key] = MaskifyCore.mask(String(val), defaultMask);
            }
          }
        }
      }
    }
  };

  traverse(target, '');
}
