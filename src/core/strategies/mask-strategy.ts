import { MaskOptions } from '../../utils';
import { splitPath } from '../../utils/paths';

// Define the contract for the masking callback
export type MaskingCallback = (value: string, options: MaskOptions) => string;

export function applyMaskStrategy(
  target: any,
  schema: Record<string, MaskOptions>,
  maskFn: MaskingCallback
): void {
  for (const [path, opts] of Object.entries(schema)) {
    const segments = splitPath(path);
    recurseMask(target, segments, 0, opts, maskFn);
  }
}

function recurseMask(
  current: any,
  segments: string[],
  i: number,
  opts: MaskOptions,
  maskFn: MaskingCallback
) {
  if (current == null) return;

  const key = segments[i];
  const isLast = i === segments.length - 1;

  // 1. Handle Wildcards (*)
  if (key === '*') {
    if (Array.isArray(current)) {
      for (let j = 0; j < current.length; j++) {
        recurseMask(current[j], segments, i + 1, opts, maskFn);
      }
    } else if (typeof current === 'object') {
      for (const k in current) {
        recurseMask(current[k], segments, i + 1, opts, maskFn);
      }
    }
    return;
  }

  // 2. Handle Numeric Indices
  if (Array.isArray(current)) {
    const idx = parseInt(key, 10);
    if (!isNaN(idx) && current[idx] != null) {
      recurseMask(current[idx], segments, i + 1, opts, maskFn);
    }
    return;
  }

  // 3. Handle Object Keys
  const nextVal = current[key];
  if (nextVal === undefined) return;

  if (isLast) {
    if (typeof nextVal === 'string') {
      // Use the injected function instead of static MaskifyCore.mask
      current[key] = maskFn(nextVal, opts);
    }
  } else {
    recurseMask(nextVal, segments, i + 1, opts, maskFn);
  }
}
