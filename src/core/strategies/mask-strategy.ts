import { MaskOptions } from '../../utils';
import { splitPath } from '../../utils/paths';

// Define the contract for the masking callback
export type MaskingCallback = (value: string, options: MaskOptions) => string;

export type MaskingCallbackAsync = (value: string, options: MaskOptions) => Promise<string> | string;

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
        if (isLast) {
          if (typeof current[j] === 'string') {
            current[j] = maskFn(current[j], opts);
          }
        } else {
          recurseMask(current[j], segments, i + 1, opts, maskFn);
        }
      }
    } else if (typeof current === 'object') {
      for (const k in current) {
        if (isLast) {
          if (typeof current[k] === 'string') {
            current[k] = maskFn(current[k], opts);
          }
        } else {
          recurseMask(current[k], segments, i + 1, opts, maskFn);
        }
      }
    }
    return;
  }

  // 2. Handle Numeric Indices
  if (Array.isArray(current)) {
    const idx = parseInt(key, 10);
    if (!isNaN(idx) && current[idx] != null) {
      if (isLast) {
        if (typeof current[idx] === 'string') {
          current[idx] = maskFn(current[idx], opts);
        }
      } else {
        recurseMask(current[idx], segments, i + 1, opts, maskFn);
      }
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

/**
 * Applies the masking strategy asynchronously.
 */
export async function applyMaskStrategyAsync(
  target: any,
  schema: Record<string, MaskOptions>,
  maskFn: MaskingCallbackAsync
): Promise<void> {
  for (const [path, opts] of Object.entries(schema)) {
    const segments = splitPath(path);
    await recurseMaskAsync(target, segments, 0, opts, maskFn);
  }
}

async function recurseMaskAsync(
  current: any,
  segments: string[],
  i: number,
  opts: MaskOptions,
  maskFn: MaskingCallbackAsync
): Promise<void> {
  if (current == null) return;

  const key = segments[i];
  const isLast = i === segments.length - 1;

  // 1. Handle Wildcards (*)
  if (key === '*') {
    if (Array.isArray(current)) {
      for (let j = 0; j < current.length; j++) {
        if (isLast) {
          if (typeof current[j] === 'string') {
            current[j] = await maskFn(current[j], opts);
          }
        } else {
          await recurseMaskAsync(current[j], segments, i + 1, opts, maskFn);
        }
      }
    } else if (typeof current === 'object') {
      for (const k in current) {
        if (isLast) {
          if (typeof current[k] === 'string') {
            current[k] = await maskFn(current[k], opts);
          }
        } else {
          await recurseMaskAsync(current[k], segments, i + 1, opts, maskFn);
        }
      }
    }
    return;
  }

  // 2. Handle Numeric Indices
  if (Array.isArray(current)) {
    const idx = parseInt(key, 10);
    if (!isNaN(idx) && current[idx] != null) {
      if (isLast) {
        if (typeof current[idx] === 'string') {
          current[idx] = await maskFn(current[idx], opts);
        }
      } else {
        await recurseMaskAsync(current[idx], segments, i + 1, opts, maskFn);
      }
    }
    return;
  }

  // 3. Handle Object Keys
  const nextVal = current[key];
  if (nextVal === undefined) return;

  if (isLast) {
    if (typeof nextVal === 'string') {
      current[key] = await maskFn(nextVal, opts);
    }
  } else {
    await recurseMaskAsync(nextVal, segments, i + 1, opts, maskFn);
  }
}
