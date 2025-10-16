import { MaskOptions } from '../utils';

/**
   * Pattern-based masking helper.
   * Supports:
   *  - '#' reveal char
   *  - '*' mask char (opts.maskChar)
   *  - '{n}' repeat expansion for previous symbol
   * Fault-tolerant: will append masked tail if value longer than pattern.
   */
export function maskPattern(
  value: unknown,
  pattern: string,
  options: Pick<MaskOptions, 'maskChar'> = {}
): string {
  // const { maskChar = '*' } = options;
  if (value == null) return '';
  const str = String(value).replace(/\s+/g, '');
  const maskChar = options.maskChar ?? '*';
  const maxTail =  4;

  // expand repeats like '#{4}' => '####'
  const expanded = pattern.replace(/([#*])\{(\d+)\}/g, (_, ch, count) =>
    ch.repeat(Number(count))
  );

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
    if (p === '#') {
      out += ch;
      vi++;
    } else if (p === '*') {
      out += maskChar;
      vi++;
    } else {
      out += p;
    }
  }

  if (vi < str.length) {
    const remaining = str.slice(vi);
    out += maskChar.repeat(Math.min(remaining.length, maxTail));
  }

  return out;
}
