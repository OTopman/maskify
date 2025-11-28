import { MaskOptions } from '../utils';

export function maskUrl(urlStr: string, opts: MaskOptions): string {
  if (!urlStr) return '';

  try {
    const url = new URL(urlStr);
    const { maskChar = '*' } = opts;

    // Default sensitive keys to look for if none provided in a hypothetical 'params' option
    // For now, we assume we want to mask values of ANY param that looks sensitive,
    // or we mask specific params if we extended MaskOptions.
    // Let's implement a safe default: mask typical sensitive keys.
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

    return url.toString();
  } catch {
    // If not a valid URL, return as is or treat as generic string
    return urlStr;
  }
}
