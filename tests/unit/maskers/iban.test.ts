import { isValidIban, maskIban, m, Maskify } from '../../../src/index';

describe('IBAN Masker & Validator', () => {
  // Test valid and invalid IBANs
  // GB82 WEST 1234 5698 7654 32 is a standard UK sample
  // DE89 3704 0044 0532 0130 00 is a standard German Bundesbank sample
  // FR14 2004 1010 0505 0001 3M02 606 is a standard French sample
  const validGbIbanFormatted = 'GB82 WEST 1234 5698 7654 32';
  const validGbIban = 'GB82WEST12345698765432';
  const validDeIban = 'DE89370400440532013000';
  const validDeIbanFormatted = 'DE89 3704 0044 0532 0130 00';

  describe('isValidIban', () => {
    it('should validate standard European IBANs', () => {
      expect(isValidIban(validGbIbanFormatted)).toBe(true);
      expect(isValidIban(validGbIban)).toBe(true);
      expect(isValidIban(validDeIban)).toBe(true);
      expect(isValidIban(validDeIbanFormatted)).toBe(true);
    });

    it('should reject invalid check digits', () => {
      // Changed GB82 to GB81
      expect(isValidIban('GB81WEST12345698765432')).toBe(false);
      // Changed DE89 to DE90
      expect(isValidIban('DE90370400440532013000')).toBe(false);
    });

    it('should reject non-IBAN formats', () => {
      expect(isValidIban('')).toBe(false);
      expect(isValidIban('1234567890')).toBe(false);
      expect(isValidIban('US82WEST12345698765432')).toBe(false);
      expect(isValidIban('GBWEST123456789')).toBe(false);
    });
  });

  describe('maskIban (direct call)', () => {
    it('should mask IBAN preserving country code and check digits (visibleStart=4) and account end (visibleEnd=4)', () => {
      const masked = maskIban(validGbIban);
      expect(masked).toBe('GB82**************5432');
    });

    it('should preserve original spacing when preserveFormat is true', () => {
      const masked = maskIban(validGbIbanFormatted);
      expect(masked).toBe('GB82 **** **** **** **54 32');
    });

    it('should respect custom visibleStart and visibleEnd', () => {
      const masked = maskIban(validDeIban, { visibleStart: 2, visibleEnd: 2 });
      expect(masked).toBe('DE******************00');
    });

    it('should respect custom maskChar', () => {
      const masked = maskIban(validDeIban, { maskChar: '#' });
      expect(masked).toBe('DE89##############3000');
    });

    it('should handle empty or short inputs gracefully', () => {
      expect(maskIban('')).toBe('');
      expect(maskIban('GB82')).toBe('****');
    });
  });

  describe('m.iban schema builder & monadic chaining', () => {
    it('should work with m.object schemas', () => {
      const schema = m.object({
        account: m.iban(),
      });

      const res = schema({ account: validGbIbanFormatted });
      expect(res.account).toBe('GB82 **** **** **** **54 32');
    });

    it('should support monadic chainable modifiers (.when, .redact, .transform)', () => {
      const schema = m.object({
        account: m.iban().when((val) => val.startsWith('GB')).redact('[UK_ACCOUNT]'),
      });

      expect(schema({ account: validGbIban })).toEqual({ account: '[UK_ACCOUNT]' });
      expect(schema({ account: validDeIban })).toEqual({ account: 'DE89**************3000' });
    });

    it('should be exposed on Maskify namespace', () => {
      expect(Maskify.iban(validDeIban)).toBe('DE89**************3000');
    });
  });
});
