/**
 * Token types supported by the lexer.
 */
export enum TokenType {
  JWT = 'JWT',
  EMAIL = 'EMAIL',
  IP = 'IP',
  CARD = 'CARD',
  PHONE = 'PHONE',
  URL = 'URL',
  TEXT = 'TEXT', // Fallback for normal text
}

export interface TokenPattern {
  type: TokenType;
  regex: RegExp;
}

/**
 * Patterns for the Lexer.
 * ⚠️ ORDER MATTERS: Specific patterns must come before generic ones.
 */
export const PATTERNS: TokenPattern[] = [
  // 1. JWT: Starts with 'ey', followed by base64 chars, dot, more chars, dot, signature
  // We use a non-greedy match for the signature to avoid over-consuming
  {
    type: TokenType.JWT,
    regex: /ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]+/,
  },

  // 2. URL: Standard URL pattern with protocol
  {
    type: TokenType.URL,
    regex:
      /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
  },

  // 3. Email: Standard email pattern
  {
    type: TokenType.EMAIL,
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  },

  // 4. IPv4: 4 groups of 1-3 digits separated by dots
  {
    type: TokenType.IP,
    regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
  },

  // 5. Credit Card: 13-19 digits, supporting dash/space separators.
  // Uses word boundaries to avoid matching timestamps or IDs.
  {
    type: TokenType.CARD,
    regex: /\b(?:\d[ -]*?){13,19}\b/,
  },

  // 6. Phone: International formats (e.g., +1-555..., (555) 123...)
  // We require at least 10 digits to avoid matching random small numbers
  {
    type: TokenType.PHONE,
    regex:
      /\b(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?\b/,
  },
];
