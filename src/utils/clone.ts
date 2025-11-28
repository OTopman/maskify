/**
 * Deep clone an object while handling circular references and preserving types.
 * Prefers 'structuredClone' if available (Node 17+).
 */
export function safeClone<T>(obj: T, map = new WeakMap()): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (typeof obj === 'function') return obj; // Preserve functions

  // 1. Return the cached clone if we've seen this object reference before
  if (map.has(obj)) return map.get(obj);

  // 2. Use native structuredClone if available (fastest & robust)
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(obj);
    } catch (e) {
      // Fallback if structuredClone fails (e.g., on functions or non-clonable types)
    }
  }

  // 3. Handle Arrays
  if (Array.isArray(obj)) {
    const arr: any[] = [];
    map.set(obj, arr); // Set map BEFORE recursion
    obj.forEach((v, i) => (arr[i] = safeClone(v, map)));
    return arr as unknown as T;
  }

  // 4. Handle Dates
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  // 5. Handle standard Objects
  const clone = {} as T;
  map.set(obj, clone); // Set map BEFORE recursion

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      (clone as any)[key] = safeClone((obj as any)[key], map);
    }
  }

  return clone;
}
