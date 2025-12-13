import { MaskOptions } from '../../utils';
import { getCachedRegex } from '../../utils/cache';
import { normalizePath } from '../../utils/paths';

export type MaskingCallback = (value: string, options: MaskOptions) => string;

export function applyAllowStrategy(
  target: any,
  schema: Record<string, MaskOptions>,
  defaultMask: MaskOptions,
  maskFn: MaskingCallback // <--- INJECTED
): void {
  // ... (Regex compilation logic remains the same) ...
  const schemaKey = Object.keys(schema).sort().join('|');
  const allowRegex = getCachedRegex(`allow:${schemaKey}`, () => {
    const patterns = Object.keys(schema).map((path) => {
      const norm = normalizePath(path);
      return '^' + norm.replace(/\./g, '\\.').replace(/\*/g, '[^.]+') + '$';
    });
    return new RegExp(patterns.join('|'));
  });

  traverse(target, '', allowRegex, defaultMask, maskFn);
}

function traverse(
  current: any,
  currentPath: string,
  allowRegex: RegExp,
  defaultMask: MaskOptions,
  maskFn: MaskingCallback // <--- Passed down
) {
  if (!current || typeof current !== 'object') return;

  for (const key in current) {
    if (!Object.prototype.hasOwnProperty.call(current, key)) continue;

    const val = current[key];
    const newPath = currentPath ? `${currentPath}.${key}` : key;

    // ... (Recursion logic for arrays/objects remains same) ...
    if (typeof val === 'object' && val !== null) {
      // ... recursive calls pass maskFn ...
      if (Array.isArray(val)) {
        for (let i = 0; i < val.length; i++) {
          traverse(val[i], `${newPath}.${i}`, allowRegex, defaultMask, maskFn);
        }
      } else {
        traverse(val, newPath, allowRegex, defaultMask, maskFn);
      }
    } else {
      // Primitive: Test against allowRegex
      if (!allowRegex.test(newPath)) {
        if (['string', 'number', 'boolean'].includes(typeof val)) {
          // Use injected maskFn
          current[key] = maskFn(String(val), defaultMask);
        }
      }
    }
  }
}
