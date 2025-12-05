import { getCachedPathSegments } from './cache';

/**
 * Normalizes object paths for consistent traversal.
 * Optimized to avoid redundant regex calls via caching.
 */
export function normalizePath(path: string): string {
  // Simple check to avoid regex overhead if not needed
  if (
    !path.includes('[') &&
    !path.includes('..') &&
    !path.startsWith('.') &&
    !path.endsWith('.')
  ) {
    return path;
  }

  return path
    .replace(/\[(\*|\d+)\]/g, '.$1')
    .replace(/\.{2,}/g, '.')
    .replace(/^\./, '')
    .replace(/\.$/, '');
}

const parseRaw = (path: string) =>
  normalizePath(path).split('.').filter(Boolean);

/**
 * Splits a path into segments with caching.
 */
export function splitPath(path: string): string[] {
  return getCachedPathSegments(path, parseRaw);
}
