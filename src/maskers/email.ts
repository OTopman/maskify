import { createDualModeMasker, MaskContext } from '../core/masker';
import { validateInput } from '../utils/validator';

export interface EmailOptions {
  visibleLocalChars?: number;
  visibleDomainChars?: number;
  /** @deprecated use visibleLocalChars instead */
  visibleStart?: number;
  /** @deprecated use visibleDomainChars instead */
  visibleEnd?: number;
  maxAsterisks?: number;
  maskChar?: string;
  strict?: boolean;
  maxLength?: number;
  allowEmpty?: boolean;
}

function runEmailMasking(email: string, opts: EmailOptions, ctx: MaskContext): string {
  const visibleLocalChars = opts.visibleLocalChars ?? opts.visibleStart ?? 1;
  const visibleDomainChars = opts.visibleDomainChars ?? opts.visibleEnd ?? 0;
  const {
    maxAsterisks = 4,
    maskChar = '*',
    strict = false,
    maxLength,
    allowEmpty,
  } = opts;

  const validation = validateInput(email, {
    strict: strict || ctx.strict,
    maxLength,
    allowEmpty,
  });
  if (!validation.valid) {
    return '';
  }
  const normalized = validation.sanitized ?? '';
  if (!normalized) return '';
  if (!normalized.includes('@')) return normalized;

  const [localPart, domainPart] = normalized.split('@');
  if (!localPart || !domainPart) return email;

  const [domainName, ...rest] = domainPart.split('.');
  const domainExt = rest.join('.') || '';

  // Mask local part
  const safeLocalVisible = Math.min(visibleLocalChars, localPart.length - 1);
  const maskedLocalCount = Math.min(
    maxAsterisks,
    Math.max(localPart.length - safeLocalVisible, 3)
  );
  const localStart = localPart.slice(0, safeLocalVisible);
  const maskedLocal = `${localStart}${maskChar.repeat(maskedLocalCount)}`;

  // Mask domain name
  const safeDomainVisible = Math.max(1, Math.min(visibleDomainChars || 1, domainName.length - 1));
  const maskedDomainCount = Math.min(
    3,
    Math.max(domainName.length - safeDomainVisible, 1)
  );
  const domainStart = domainName.slice(0, safeDomainVisible);
  const maskedDomain = `${domainStart}${maskChar.repeat(maskedDomainCount)}`;

  return `${maskedLocal}@${maskedDomain}${domainExt ? `.${domainExt}` : ''}`;
}

export const maskEmail = createDualModeMasker(runEmailMasking);
