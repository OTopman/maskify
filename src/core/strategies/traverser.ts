/**
 * A callback function invoked for every node in the object tree.
 * @param key - The property key.
 * @param value - The property value.
 * @param parent - The object containing the property.
 */
export type Visitor = (key: string, value: any, parent: any) => void;

export type VisitorAsync = (key: string, value: any, parent: any) => Promise<void> | void;

/**
 * Recursively visits every property in an object or array.
 * Uses a WeakSet to detect and prevent circular references.
 *
 * @param target - The object/array to traverse.
 * @param visitor - The callback to execute on each node.
 * @param seen - Internal set for circular dependency tracking.
 */
export function deepVisit(
  target: any,
  visitor: Visitor,
  seen = new WeakSet<object>()
) {
  if (!target || typeof target !== 'object') return;

  if (seen.has(target)) return;
  seen.add(target);

  // Iterate keys
  for (const key in target) {
    if (Object.prototype.hasOwnProperty.call(target, key)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      const val = target[key];

      // Execute visitor
      visitor(key, val, target);

      // Recurse if object
      if (typeof val === 'object' && val !== null) {
        deepVisit(val, visitor, seen);
      }
    }
  }
}

/**
 * Recursively visits every property in an object or array asynchronously.
 */
export async function deepVisitAsync(
  target: any,
  visitor: VisitorAsync,
  seen = new WeakSet<object>()
): Promise<void> {
  if (!target || typeof target !== 'object') return;

  if (seen.has(target)) return;
  seen.add(target);

  // Iterate keys
  for (const key in target) {
    if (Object.prototype.hasOwnProperty.call(target, key)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      const val = target[key];

      // Execute visitor and await it
      await visitor(key, val, target);

      // Recurse if object
      if (typeof val === 'object' && val !== null) {
        await deepVisitAsync(val, visitor, seen);
      }
    }
  }
}
