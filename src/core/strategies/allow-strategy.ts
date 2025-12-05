import { MaskOptions } from '../../utils';
import { normalizePath } from '../../utils/paths';
import { getCachedRegex } from '../../utils/cache';
import { MaskifyCore } from '../maskify';

export function applyAllowStrategy(
  target: any,
  schema: Record<string, MaskOptions>,
  defaultMask: MaskOptions
): void {
  // ⚡️ Performance: Cache the combined Allowlist Regex
  // Creating one master regex for the whole schema is faster than looping .some() on array of regexes
  const schemaKey = Object.keys(schema).sort().join('|');

  const allowRegex = getCachedRegex(`allow:${schemaKey}`, () => {
    const patterns = Object.keys(schema).map((path) => {
      const norm = normalizePath(path);
      return '^' + norm.replace(/\./g, '\\.').replace(/\*/g, '[^.]+') + '$';
    });
    // Create a giant OR regex: (^id$)|(^meta\.time$)
    return new RegExp(patterns.join('|'));
  });

  traverse(target, '', allowRegex, defaultMask);
}

function traverse(
  current: any,
  currentPath: string,
  allowRegex: RegExp,
  defaultMask: MaskOptions
) {
  if (!current || typeof current !== 'object') return;

  // Optimization: Loop using for..in is generally fast enough,
  // but Object.keys + for loop can be faster in V8 for large objects.
  // Sticking to for..in for memory efficiency on deep recursion.
  for (const key in current) {
    // eslint-disable-next-line no-prototype-builtins
    if (!Object.prototype.hasOwnProperty.call(current, key)) continue;

    const val = current[key];
    const newPath = currentPath ? `${currentPath}.${key}` : key;

    if (typeof val === 'object' && val !== null) {
      if (Array.isArray(val)) {
        for (let i = 0; i < val.length; i++) {
          traverse(val[i], `${newPath}.${i}`, allowRegex, defaultMask);
        }
      } else {
        traverse(val, newPath, allowRegex, defaultMask);
      }
    } else {
      // Primitive: Test against pre-compiled Master Regex
      if (!allowRegex.test(newPath)) {
        if (
          typeof val === 'string' ||
          typeof val === 'number' ||
          typeof val === 'boolean'
        ) {
          current[key] = MaskifyCore.mask(String(val), defaultMask);
        }
      }
    }
  }
}
