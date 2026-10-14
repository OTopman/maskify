import { isValidSsn, m, Maskify, maskSsn } from '../../../src/index';

describe('SSN Masker & Validator', () => {
  const validSsnFormatted = '123-45-6789';
  const validSsn = '123456789';

  describe('isValidSsn', () => {
    it('should validate standard US SSNs', () => {
      expect(isValidSsn(validSsnFormatted)).toBe(true);
      expect(isValidSsn(validSsn)).toBe(true);
      expect(isValidSsn('888-99-1111')).toBe(true);
    });

    it('should reject invalid area numbers (000, 666, 900-999)', () => {
      expect(isValidSsn('000-45-6789')).toBe(false);
      expect(isValidSsn('666-45-6789')).toBe(false);
      expect(isValidSsn('900-45-6789')).toBe(false);
      expect(isValidSsn('999-45-6789')).toBe(false);
    });

    it('should reject invalid group numbers (00)', () => {
      expect(isValidSsn('123-00-6789')).toBe(false);
    });

    it('should reject invalid serial numbers (0000)', () => {
      expect(isValidSsn('123-45-0000')).toBe(false);
    });

    it('should reject wrong length strings', () => {
      expect(isValidSsn('')).toBe(false);
      expect(isValidSsn('123-45-678')).toBe(false);
      expect(isValidSsn('123-45-67890')).toBe(false);
    });
  });

  describe('maskSsn (direct call)', () => {
    it('should mask SSN with standard US format preserving last 4 digits (***-**-6789)', () => {
      expect(maskSsn(validSsnFormatted)).toBe('***-**-6789');
    });

    it('should preserve unhyphenated format if input has no separators', () => {
      expect(maskSsn(validSsn)).toBe('*****6789');
    });

    it('should preserve space formatting if input uses spaces', () => {
      expect(maskSsn('123 45 6789')).toBe('*** ** 6789');
    });

    it('should respect custom visibleEnd and maskChar', () => {
      expect(maskSsn(validSsnFormatted, { visibleEnd: 2, maskChar: '#' })).toBe('###-##-##89');
    });

    it('should handle empty input gracefully', () => {
      expect(maskSsn('')).toBe('');
    });
  });

  describe('m.ssn schema builder', () => {
    it('should work with m.object schemas', () => {
      const schema = m.object({
        taxId: m.ssn(),
      });

      expect(schema({ taxId: validSsnFormatted })).toEqual({ taxId: '***-**-6789' });
    });

    it('should support monadic chainable modifiers', () => {
      const schema = m.object({
        taxId: m.ssn().redact('[CONFIDENTIAL_SSN]'),
      });

      expect(schema({ taxId: validSsnFormatted })).toEqual({ taxId: '[CONFIDENTIAL_SSN]' });
    });

    it('should be exposed on Maskify namespace', () => {
      expect(Maskify.ssn(validSsnFormatted)).toBe('***-**-6789');
    });
  });
});
