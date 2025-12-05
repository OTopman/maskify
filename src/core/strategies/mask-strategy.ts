import { MaskifyCore } from '../maskify';
import { MaskOptions } from '../../utils';
import { splitPath } from '../../utils/paths';

export function applyMaskStrategy(
  target: any,
  schema: Record<string, MaskOptions>
): void {
  // Iterate schema entries
  for (const [path, opts] of Object.entries(schema)) {
    // ⚡️ Performance: Use cached path segments
    const segments = splitPath(path);

    // Start recursion with pre-calculated segments
    recurseMask(target, segments, 0, opts);
  }
}

function recurseMask(
  current: any,
  segments: string[],
  i: number,
  opts: MaskOptions
) {
  if (current == null) return;

  const key = segments[i];
  const isLast = i === segments.length - 1;

  // 1. Handle Wildcards (*)
  if (key === '*') {
    if (Array.isArray(current)) {
      for (let j = 0; j < current.length; j++) {
        recurseMask(current[j], segments, i + 1, opts);
      }
    } else if (typeof current === 'object') {
      for (const k in current) {
        recurseMask(current[k], segments, i + 1, opts);
      }
    }
    return;
  }

  // 2. Handle Numeric Indices (Optimization: Check array directly)
  if (Array.isArray(current)) {
    // Only attempt if key looks like an index
    const idx = parseInt(key, 10);
    if (!isNaN(idx)) {
      if (current[idx] != null)
        recurseMask(current[idx], segments, i + 1, opts);
    }
    return;
  }

  // 3. Handle Object Keys
  // Optimization: direct property access check is faster than 'in' operator for own props
  const nextVal = current[key];
  if (nextVal === undefined) return;

  if (isLast) {
    if (typeof nextVal === 'string') {
      current[key] = MaskifyCore.mask(nextVal, opts);
    }
  } else {
    recurseMask(nextVal, segments, i + 1, opts);
  }
}
