import { MaskOptions } from '../../utils';
import { getCachedRegex } from '../../utils/cache';
import { normalizePath } from '../../utils/paths';

export type MaskingCallback = (value: string, options: MaskOptions) => string;

export type MaskingCallbackAsync = (value: string, options: MaskOptions) => Promise<string> | string;

export function applyAllowStrategy(
  target: any,
  schema: Record<string, MaskOptions>,
  defaultMask: MaskOptions,
  maskFn: MaskingCallback
): void {
  const schemaKey = Object.keys(schema).sort().join('|');
  const allowRegex = getCachedRegex(`allow:${schemaKey}`, () => {
    const patterns = Object.keys(schema).map((path) => {
      const norm = normalizePath(path);
      const escaped = norm.replace(/[+?^${}()|[\]\\]/g, '\\$&');
      return '^' + escaped.replace(/\./g, '\\.').replace(/\*/g, '[^.]+') + '$';
    });
    return new RegExp(patterns.join('|'));
  });

  traverse(target, '', allowRegex, defaultMask, maskFn, new WeakSet<object>());
}

function traverse(
  current: any,
  currentPath: string,
  allowRegex: RegExp,
  defaultMask: MaskOptions,
  maskFn: MaskingCallback,
  seen: WeakSet<object>
) {
  if (!current || typeof current !== 'object') return;
  if (seen.has(current)) return;
  seen.add(current);

  for (const key in current) {
    if (!Object.prototype.hasOwnProperty.call(current, key)) continue;
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;

    const val = current[key];
    const newPath = currentPath ? `${currentPath}.${key}` : key;

    if (typeof val === 'object' && val !== null) {
      if (Array.isArray(val)) {
        for (let i = 0; i < val.length; i++) {
          const item = val[i];
          const itemPath = `${newPath}.${i}`;
          if (item && typeof item === 'object') {
            traverse(item, itemPath, allowRegex, defaultMask, maskFn, seen);
          } else {
            if (!allowRegex.test(itemPath)) {
              if (['string', 'number', 'boolean'].includes(typeof item)) {
                val[i] = maskFn(String(item), defaultMask);
              }
            }
          }
        }
      } else {
        traverse(val, newPath, allowRegex, defaultMask, maskFn, seen);
      }
    } else {
      if (!allowRegex.test(newPath)) {
        if (['string', 'number', 'boolean'].includes(typeof val)) {
          current[key] = maskFn(String(val), defaultMask);
        }
      }
    }
  }
}

/**
 * Applies allowlist-based masking asynchronously.
 */
export async function applyAllowStrategyAsync(
  target: any,
  schema: Record<string, MaskOptions>,
  defaultMask: MaskOptions,
  maskFn: MaskingCallbackAsync
): Promise<void> {
  const schemaKey = Object.keys(schema).sort().join('|');
  const allowRegex = getCachedRegex(`allow:${schemaKey}`, () => {
    const patterns = Object.keys(schema).map((path) => {
      const norm = normalizePath(path);
      const escaped = norm.replace(/[+?^${}()|[\]\\]/g, '\\$&');
      return '^' + escaped.replace(/\./g, '\\.').replace(/\*/g, '[^.]+') + '$';
    });
    return new RegExp(patterns.join('|'));
  });

  await traverseAsync(target, '', allowRegex, defaultMask, maskFn, new WeakSet<object>());
}

async function traverseAsync(
  current: any,
  currentPath: string,
  allowRegex: RegExp,
  defaultMask: MaskOptions,
  maskFn: MaskingCallbackAsync,
  seen: WeakSet<object>
): Promise<void> {
  if (!current || typeof current !== 'object') return;
  if (seen.has(current)) return;
  seen.add(current);

  for (const key in current) {
    if (!Object.prototype.hasOwnProperty.call(current, key)) continue;
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;

    const val = current[key];
    const newPath = currentPath ? `${currentPath}.${key}` : key;

    if (typeof val === 'object' && val !== null) {
      if (Array.isArray(val)) {
        for (let i = 0; i < val.length; i++) {
          const item = val[i];
          const itemPath = `${newPath}.${i}`;
          if (item && typeof item === 'object') {
            await traverseAsync(item, itemPath, allowRegex, defaultMask, maskFn, seen);
          } else {
            if (!allowRegex.test(itemPath)) {
              if (['string', 'number', 'boolean'].includes(typeof item)) {
                val[i] = await maskFn(String(item), defaultMask);
              }
            }
          }
        }
      } else {
        await traverseAsync(val, newPath, allowRegex, defaultMask, maskFn, seen);
      }
    } else {
      if (!allowRegex.test(newPath)) {
        if (['string', 'number', 'boolean'].includes(typeof val)) {
          current[key] = await maskFn(String(val), defaultMask);
        }
      }
    }
  }
}
