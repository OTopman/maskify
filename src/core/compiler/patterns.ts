import { RegexLib } from '../patterns/definitions';

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
  { type: TokenType.JWT, regex: RegexLib.JWT },
  { type: TokenType.URL, regex: RegexLib.URL },
  { type: TokenType.EMAIL, regex: RegexLib.EMAIL },
  { type: TokenType.IP, regex: RegexLib.IPV4 },
  { type: TokenType.IP, regex: RegexLib.IPV6 }, // Add IPv6 support to lexer!
  { type: TokenType.CARD, regex: RegexLib.CARD },
  { type: TokenType.PHONE, regex: RegexLib.PHONE },
];
