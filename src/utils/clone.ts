export function safeClone<T>(obj: T, seen = new WeakSet()): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (seen.has(obj)) return obj;
  seen.add(obj);

  if (Array.isArray(obj)) return obj.map((i) => safeClone(i, seen)) as T;

  const clone: any = {};
  for (const key in obj) {
    clone[key] = safeClone((obj as any)[key], seen);
  }
  return clone;
}
