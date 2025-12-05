import { GlobalConfigLoader } from './config';

/**
 * A size-limited cache to prevent memory leaks in dynamic environments.
 * When the limit is reached, it evicts the oldest entry (FIFO).
 */
class LimitedCache<K, V> {
  private map = new Map<K, V>();
  private readonly limit: number;

  constructor(limit = 1000) {
    this.limit = limit;
  }

  get(key: K): V | undefined {
    return this.map.get(key);
  }

  set(key: K, value: V): void {
    // Safety Valve: Prevent infinite growth
    if (this.map.size >= this.limit) {
      // Maps preserve insertion order. The first key is the oldest.
      const firstKey = this.map.keys().next().value;
      if (firstKey !== undefined) {
        this.map.delete(firstKey);
      }
    }
    this.map.set(key, value);
  }

  clear() {
    this.map.clear();
  }
}

// 2000 unique paths is plenty for most apps (even huge monoliths)
export const pathCache = new LimitedCache<string, string[]>(2000);

// 1000 unique regex patterns is highly generous
export const regexCache = new LimitedCache<string, RegExp>(1000);

export function getCachedPathSegments(
  path: string,
  parser: (p: string) => string[]
): string[] {
  // Check global config (cached access)
  if (GlobalConfigLoader.load().disableCache) {
    return parser(path);
  }

  
  let segments = pathCache.get(path);
  if (!segments) {
    segments = parser(path);
    pathCache.set(path, segments);
  }
  return segments;
}

export function getCachedRegex(key: string, creator: () => RegExp): RegExp {
  let regex = regexCache.get(key);
  if (!regex) {
    regex = creator();
    regexCache.set(key, regex);
  }
  return regex;
}
