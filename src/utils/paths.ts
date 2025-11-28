/**
 * Normalizes object paths for consistent traversal.
 * Example: "users[*].email" -> "users.*.email"
 * Example: "items[0].id" -> "items.0.id"
 */
export function normalizePath(path: string): string {
  return path
    .replace(/\[(\*|\d+)\]/g, '.$1') // convert [*] or [0] to .* or .0
    .replace(/\.{2,}/g, '.') // collapse double dots
    .replace(/^\./, '') // remove leading dot
    .replace(/\.$/, ''); // remove trailing dot
}

/**
 * Splits a path into segments.
 */
export function splitPath(path: string): string[] {
  return normalizePath(path).split('.').filter(Boolean);
}
