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

  // IBAN: 2-letter country code + 2 check digits + 11-30 alphanumeric characters
  IBAN: /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/,

  // SSN: 3 digits - 2 digits - 4 digits (with area/group/serial checks)
  SSN: /^(?!000|666|9\d{2})\d{3}[-\s]?(?!00)\d{2}[-\s]?(?!0000)\d{4}$/,

  // Cloud secrets and tokens
  SECRET_AWS: /\b(?:AKIA|ASIA|AROA)[0-9A-Z]{16}\b/,
  SECRET_GITHUB: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}\b|\bgithub_pat_[A-Za-z0-9_]{82}\b/,
  SECRET_STRIPE: /\b(?:sk|pk|rk)_(?:live|test)_[0-9a-zA-Z]{24,99}\b/,
  SECRET_BEARER: /\bBearer\s+(?!eyJ)[A-Za-z0-9\-._~+/]+=*\b/,
  SECRET_PRIVATE_KEY: /-----BEGIN[ A-Z0-9_-]+PRIVATE KEY-----/,

  // Sensitive field names — anchored to the *whole* key so "author" doesn't
  // fall into "auth" and "secretary" doesn't fall into "secret".
  SENSITIVE_KEYS:
    /^(?:password|passwd|pwd|secret|token|api[_-]?key|auth|authorization|credential|ssn|sin|nin|iban|bban|credit[_-]?card|card[_-]?number|cvv|cvc|pin|otp|access[_-]?token|refresh[_-]?token)$/i,
} as const;

// Freeze to prevent runtime modification
Object.freeze(PATTERNS);
