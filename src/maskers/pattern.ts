import { createMasker, Masker, MaskContext } from '../core/masker';

export interface PatternOptions {
  pattern: string;
  maskChar?: string;
}

function runPatternMasking(value: any, pattern: string, maskChar = '*', _ctx: MaskContext = {}): string {
  if (value == null) return '';
  const str = String(value);
  const maxTail = 4;

  const expanded = pattern.replace(/([#*])\{(\d+)\}/g, (_, ch, count) => {
    const repeatCount = Number(count);
    if (repeatCount > 1000) {
      throw new RangeError('Pattern repeat count exceeds limit of 1000');
    }
    return ch.repeat(repeatCount);
  });

  let vi = 0;
  let out = '';

  for (let i = 0; i < expanded.length; i++) {
    const p = expanded[i];
    if (vi >= str.length) {
      if (p === '#' || p === '*') continue;
      out += p;
      continue;
    }

    const ch = str[vi];

    if (/\s/.test(ch) && p !== ch && (p === '#' || p === '*')) {
      out += ch;
      vi++;
      i--;
      continue;
    }

    if (p === '#') {
      out += ch;
      vi++;
    } else if (p === '*') {
      out += maskChar;
      vi++;
    } else {
      out += p;
      if (p === ch) {
        vi++;
      }
    }
  }

  if (vi < str.length) {
    const remaining = str.slice(vi);
    out += maskChar.repeat(Math.min(remaining.length, maxTail));
  }

  return out;
}

// maskPattern takes (value, pattern, options) rather than (value, options) —
// it doesn't fit createDualModeMasker's shared dispatch shape, so the
// direct-vs-builder check is hand-rolled here instead.
export function maskPattern(value: any, pattern: string, options?: { maskChar?: string }): string;
export function maskPattern(opts: PatternOptions): Masker<any>;
export function maskPattern(first: any, second?: any, third?: any): any {
  const isBuilder = second === undefined && first !== null && typeof first === 'object';
  if (isBuilder) {
    const opts = first as PatternOptions;
    return createMasker((val: any, ctx: MaskContext) => runPatternMasking(val, opts.pattern, opts.maskChar, ctx));
  }
  return runPatternMasking(first, second, third?.maskChar);
}
