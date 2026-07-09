import { createDualModeMasker, MaskContext } from '../core/masker';

export interface CardOptions {
  maxAsterisks?: number;
  maskChar?: string;
}

function runCardMasking(card: string, opts: CardOptions, _ctx: MaskContext): string {
  const { maxAsterisks = 4, maskChar = '*' } = opts;
  if (!card) return '';

  const digitsOnly = card.replace(/\D/g, '');
  const groups = digitsOnly.match(/.{1,4}/g) || [];

  const maskedGroups = groups.map((group, i) =>
    i === 0 || i === groups.length - 1 ? group : maskChar.repeat(maxAsterisks)
  );

  return maskedGroups.join(' ');
}

export const maskCard = createDualModeMasker(runCardMasking, { coerce: true });
