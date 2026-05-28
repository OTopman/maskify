import { MaskOptions } from '../utils';

export function maskUrl(urlStr: string, opts: MaskOptions): string {
  if (!urlStr) return '';

  try {
    const isRelative = !urlStr.startsWith('http://') && !urlStr.startsWith('https://');
    if (isRelative && !urlStr.startsWith('/')) {
      // Not an absolute URL and not a path — return as-is
      return urlStr;
    }
    const url = isRelative ? new URL(urlStr, 'http://localhost') : new URL(urlStr);
    const { maskChar = '*' } = opts;

    if (url.password) {
      url.password = maskChar.repeat(8);
    }

    const sensitiveKeys = [
      'token',
      'key',
      'password',
      'secret',
      'auth',
      'apikey',
    ];

    url.searchParams.forEach((value, key) => {
      if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
        url.searchParams.set(key, maskChar.repeat(8));
      }
    });

    return isRelative ? url.pathname + url.search : url.toString();
  } catch {
    // If not a valid URL, return as is or treat as generic string
    return urlStr;
  }
}
