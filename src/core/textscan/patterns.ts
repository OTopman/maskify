/**
 * Token types supported by the lexer.
 */
export enum TokenType {
  JWT = 'JWT',
  EMAIL = 'EMAIL',
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
 * Specific patterns (like JWT) should come before generic ones (like IP or Phone)
 * to prevent partial matches.
 */
export const PATTERNS: TokenPattern[] = [
  { type: TokenType.JWT, regex: /\beyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\b/ },
  { type: TokenType.URL, regex: /\bhttps?:\/\/[^\s]+/ },
  {
    type: TokenType.EMAIL,
    regex:
      /\b[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+\b/,
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
