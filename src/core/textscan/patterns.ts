/**
 * Token types supported by the lexer.
 */
export enum TokenType {
  JWT = 'JWT',
  SECRET = 'SECRET',
  EMAIL = 'EMAIL',
  IBAN = 'IBAN',
  SSN = 'SSN',
  IP = 'IP', // Covers both IPv4 and IPv6
  CARD = 'CARD',
  PHONE = 'PHONE',
  URL = 'URL',
  TEXT = 'TEXT',
}

export interface TokenPattern {
  type: TokenType;
  regex: RegExp;
}

/**
 * Defines the priority order for the Lexer.
 * Specific patterns (like JWT, secrets) should come before generic ones (like IP or Phone)
 * to prevent partial matches.
 */
export const PATTERNS: TokenPattern[] = [
  { type: TokenType.JWT, regex: /\beyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\b/ },
  {
    type: TokenType.SECRET,
    regex:
      /-----BEGIN[ A-Z0-9_-]+PRIVATE KEY(?: BLOCK)?-----(?:[\s\S]*?-----END[ A-Z0-9_-]+PRIVATE KEY(?: BLOCK)?-----|(?:[\r\n]+(?:[A-Za-z0-9+/=]+={0,2}(?:\.{3})?|Proc-Type:[^\r\n]+|DEK-Info:[^\r\n]+)(?=[\r\n]|$))+)?/,
  },
  { type: TokenType.SECRET, regex: /\b(?:AKIA|ASIA|AROA)[0-9A-Z]{16}\b/ },
  {
    type: TokenType.SECRET,
    regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}\b|\bgithub_pat_[A-Za-z0-9_]{82}\b/,
  },
  { type: TokenType.SECRET, regex: /\b(?:sk|pk|rk)_(?:live|test)_[0-9a-zA-Z]{24,99}\b/ },
  { type: TokenType.SECRET, regex: /\bBearer\s+(?!eyJ)[A-Za-z0-9\-._~+/]+=*\b/ },
  { type: TokenType.URL, regex: /\bhttps?:\/\/[^\s]+/ },
  {
    type: TokenType.EMAIL,
    regex:
      /\b[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+\b/,
  },
  {
    type: TokenType.IBAN,
    regex: /\b[A-Z]{2}\d{2}(?:[ -]?[A-Z0-9]{4}){2,7}(?:[ -]?[A-Z0-9]{1,4})?\b/,
  },
  {
    type: TokenType.SSN,
    regex: /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/,
  },
  {
    type: TokenType.IP,
    regex:
      /\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/,
  },
  {
    type: TokenType.IP,
    regex:
      /\b(?:[0-9a-fA-F]{1,4}:){1,7}:|::(?:[0-9a-fA-F]{1,4}:){0,7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}[0-9a-fA-F]{1,4}\b/,
  },
  { type: TokenType.CARD, regex: /\b(?:\d{4}[\s-]?){3,4}\d{1,4}\b/ },
  { type: TokenType.PHONE, regex: /\b\+?\d[\d()\-\s]{6,16}\d\b/ },
];

