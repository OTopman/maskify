import { MaskOptions } from '../utils';

export function maskCard(
  card: string,
  options: Pick<MaskOptions, 'maxAsterisks' | 'maskChar'>
): string {
  const { maxAsterisks = 4, maskChar = '*' } = options;

  if (!card) return '';

  const digitsOnly = card.replace(/\D/g, '');
  const groups = digitsOnly.match(/.{1,4}/g) || [];

  const maskedGroups = groups.map((group, i) =>
    i === 0 || i === groups.length - 1 ? group : maskChar.repeat(maxAsterisks!)
  );

  return maskedGroups.join(' ');
}
