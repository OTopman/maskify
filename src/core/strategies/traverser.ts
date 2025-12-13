/**
 * A callback function invoked for every node in the object tree.
 * @param key - The property key.
 * @param value - The property value.
 * @param parent - The object containing the property.
 */
export type Visitor = (key: string, value: any, parent: any) => void;

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
