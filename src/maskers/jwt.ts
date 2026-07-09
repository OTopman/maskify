import { createDualModeMasker, MaskContext } from '../core/masker';

export interface JwtOptions {
  maskChar?: string;
}

function runJwtMasking(token: string, opts: JwtOptions, _ctx: MaskContext): string {
  if (!token || typeof token !== 'string') return '';

  const parts = token.split('.');
  if (parts.length !== 3) return token;

  const [header, payload, signature] = parts;
  const { maskChar = '*' } = opts;

  const maskedPayload = maskChar.repeat(Math.min(payload.length, 10));
  const maskedSig = maskChar.repeat(Math.min(signature.length, 10));

  return `${header}.${maskedPayload}.${maskedSig}`;
}

export const maskJwt = createDualModeMasker(runJwtMasking);
