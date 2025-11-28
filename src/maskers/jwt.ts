import { MaskOptions } from '../utils';

export function maskJwt(token: string, opts: MaskOptions): string {
  if (!token || typeof token !== 'string') return '';

  const parts = token.split('.');
  if (parts.length !== 3) return token; // Not a valid JWT structure

  const [header, payload, signature] = parts;
  const { maskChar = '*' } = opts;

  // Header: Visible (safe)
  // Payload: Masked (contains PII)
  // Signature: Masked (contains security data)

  const maskedPayload = maskChar.repeat(Math.min(payload.length, 10));
  const maskedSig = maskChar.repeat(Math.min(signature.length, 10));

  return `${header}.${maskedPayload}.${maskedSig}`;
}
