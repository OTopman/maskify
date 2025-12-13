/**
 * @module Patterns
 * Centralized repository for all Regular Expression patterns used across the library.
 * This ensures consistency between Detectors, Maskers, and the Smart Lexer.
 */

export const RegexLib = {
  /**
   * Matches standard email addresses.
   * Captures: group 1 (local), group 2 (domain).
   */
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,

  /**
   * Matches IPv4 addresses.
   * Checks for 4 groups of 1-3 digits separated by dots.
   */
  IPV4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/,

  /**
   * Matches IPv6 addresses (simplified).
   * Checks for hex groups separated by colons.
   */
  IPV6: /([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}/,

  /**
   * Matches Credit Card numbers (13-19 digits).
   * supports space and dash separators.
   */
  CARD: /\b(?:\d[ -]*?){13,19}\b/,

  /**
   * Matches International Phone Numbers.
   * Supports: +1-555-555-5555, (555) 555-5555
   */
  PHONE:
    /\b(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?\b/,

  /**
   * Matches valid characters for a Name (Alphabets, space, dot, apostrophe, dash).
   * Used in combination with a space check to avoid matching single words.
   */
  NAME_CHARS: /^[A-Za-z\s.'-]+$/,

  /**
   * Matches the general structure of an address (starting with digits).
   * e.g. "123 Main St"
   */
  ADDRESS_START: /\d+\s+[\w\s,.-]+/,

  /**
   * Matches common street suffixes to reduce false positives for addresses.
   */
  ADDRESS_SUFFIX: /(road|street|st|rd|ave|lane|close|way|boulevard|crescent)/i,

  /**
   * Matches JSON Web Tokens (JWT).
   * Header.Payload.Signature
   */
  JWT: /ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]+/,

  /**
   * Matches standard URLs with protocol (http/https).
   */
  URL: /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
};
