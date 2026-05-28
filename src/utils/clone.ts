/**
 * Deep-clones a value preserving cycles. Prefers the native `structuredClone`
 * when available; otherwise falls back to a manual walk that handles Dates,
 * arrays, and plain objects. Functions are returned by reference since they
 * can't be structurally cloned.
 */
export function safeClone<T>(obj: T, map = new WeakMap<object, unknown>()): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (typeof obj === 'function') return obj;

  if (map.has(obj as object)) return map.get(obj as object) as T;

  // Only use structuredClone for plain objects/arrays — it strips custom prototypes
  const proto = Object.getPrototypeOf(obj);
  const isPlain = proto === Object.prototype || proto === null || Array.isArray(obj);

  if (isPlain && typeof structuredClone === 'function') {
    try {
      return structuredClone(obj);
    } catch {
      // Objects containing functions, class instances with getters, or
      // values with ORM-specific symbols can fail structuredClone. Fall
      // through to the manual walk below.
    }
  }

  if (Array.isArray(obj)) {
    const arr: unknown[] = [];
    map.set(obj as object, arr);
    for (let i = 0; i < obj.length; i++) {
      arr[i] = safeClone((obj as unknown[])[i], map);
    }
    return arr as unknown as T;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof Map) {
    const cloned = new Map();
    map.set(obj as object, cloned);
    for (const [k, v] of obj.entries()) {
      cloned.set(safeClone(k, map), safeClone(v, map));
    }
    return cloned as unknown as T;
  }

  if (obj instanceof Set) {
    const cloned = new Set();
    map.set(obj as object, cloned);
    for (const v of obj.values()) {
      cloned.add(safeClone(v, map));
    }
    return cloned as unknown as T;
  }

  const clone = Object.create(proto) as T;
  map.set(obj as object, clone as object);

  for (const key of Object.keys(obj as object)) {
    (clone as any)[key] = safeClone((obj as any)[key], map);
  }

  return clone;
}
