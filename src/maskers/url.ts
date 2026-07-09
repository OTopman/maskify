import { createDualModeMasker, MaskContext } from '../core/masker';

export interface UrlOptions {
  maskChar?: string;
}

function runUrlMasking(urlStr: string, opts: UrlOptions, _ctx: MaskContext): string {
  if (!urlStr) return '';

  try {
    const isRelative = !urlStr.startsWith('http://') && !urlStr.startsWith('https://');
    if (isRelative && !urlStr.startsWith('/')) {
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
    return urlStr;
  }
}

export const maskUrl = createDualModeMasker(runUrlMasking);
