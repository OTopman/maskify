/**
 * Pre-compiled, frozen regex patterns for PII detection.
 *
 * These are compiled ONCE at module load,
 * not on every detection call. Critical for high-throughput scenarios.
 */
export const PATTERNS = {
  // Email: RFC 5322 simplified (practical coverage)
  EMAIL:
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/,

  // Phone: E.164 + common formats
  PHONE: /^\+?[\d\s\-().]{7,}$/,

  // Credit Card: 13-19 digits, optional spaces/dashes
  CARD: /^(?:\d{4}[\s-]?){3,4}\d{1,4}$/,

  // IPv4
  IPV4: /^(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,

  // IPv6 (supports abbreviation)
  IPV6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,7}:$|^(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}$|^(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}$|^(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:(?::[0-9a-fA-F]{1,4}){1,6}$|^:(?::[0-9a-fA-F]{1,4}){1,7}$|^::$/,

  // JWT: header.payload.signature (header must be base64url "eyJ..." prefix;
  // payload/signature are base64url but can't always be assumed to start with "eyJ")
  JWT: /^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,

  // URL with query params
  URL: /^https?:\/\/[^\s]+$/,

  // Address start (street number)
  ADDRESS_START: /^\d+[\s-]/,

  // Address suffix (Street, Ave, etc.)
  ADDRESS_SUFFIX:
    /\b(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl|Way|Terrace|Terr)\b/i,

  // Name characters (Unicode letters, spaces, hyphens, apostrophes)
  NAME_CHARS: /^[\p{L}\s.\-']+$/u,

  // Sensitive field names — anchored to the *whole* key so "author" doesn't
  // fall into "auth" and "secretary" doesn't fall into "secret".
  SENSITIVE_KEYS:
    /^(?:password|passwd|pwd|secret|token|api[_-]?key|auth|authorization|credential|ssn|sin|nin|credit[_-]?card|card[_-]?number|cvv|cvc|pin|otp|access[_-]?token|refresh[_-]?token)$/i,
} as const;

// Freeze to prevent runtime modification
Object.freeze(PATTERNS);
