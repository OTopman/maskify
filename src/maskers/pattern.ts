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
  if (value == null) return '';
  const str = String(value);
  const maskChar = options.maskChar ?? '*';
  const maxTail = 4;

  // expand repeats like '#{4}' => '####'
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

    // Preserving whitespace in input if the pattern expects a mask/reveal character
    if (/\s/.test(ch) && p !== ch && (p === '#' || p === '*')) {
      out += ch;
      vi++;
      i--; // Re-evaluate the same pattern character for the next non-whitespace character
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
        vi++; // Consume formatting characters if they match
      }
    }
  }

  if (vi < str.length) {
    const remaining = str.slice(vi);
    out += maskChar.repeat(Math.min(remaining.length, maxTail));
  }

  return out;
}
