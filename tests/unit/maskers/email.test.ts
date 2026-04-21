import { maskEmail } from '../../../src/maskers/email';
import { MaskifyValidationError } from '../../../src/utils/errors';

describe('maskEmail', () => {
  describe('basic masking', () => {
    it('masks local part with default options', () => {
      expect(maskEmail('user@example.com')).toBe('u***@e***.com');
    });

    it('preserves visibleStart characters', () => {
      expect(maskEmail('john@example.com', { visibleStart: 2 })).toBe(
        'jo***@e***.com',
      );
    });

    it('preserves visibleEnd characters in domain', () => {
      expect(maskEmail('user@example.com', { visibleEnd: 2 })).toBe(
        'u***@ex***.com',
      );
    });

    it('uses custom maskChar', () => {
      expect(maskEmail('test@domain.org', { maskChar: '#' })).toBe(
        't###@d###.org',
      );
    });

    it('respects maxAsterisks limit', () => {
      expect(maskEmail('verylongusername@verylongdomain.com', { maxAsterisks: 2 })).toMatch(/^v\*{2}@v\*{2,3}\.com$/);
    });
  });

  describe('edge cases', () => {
    it('handles single-char local part', () => {
      expect(maskEmail('a@b.com')).toBe('***@b*.com');
    });

    it('handles subdomain emails', () => {
      expect(maskEmail('user@mail.example.co.uk')).toBe(
        'u***@m***.example.co.uk',
      );
    });

    it('handles plus-addressing', () => {
      expect(maskEmail('user+tag@example.com')).toBe('u****@e***.com');
    });

    it('returns empty string for empty input', () => {
      expect(maskEmail('')).toBe('');
    });

    it('returns original value for non-email strings (non-strict)', () => {
      expect(maskEmail('not-an-email')).toBe('not-an-email');
    });
  });

  describe('strict mode validation', () => {
    it('throws on non-string input in strict mode', () => {
      expect(() => {
        // @ts-expect-error testing invalid input
        maskEmail(null, { strict: true });
      }).toThrow(MaskifyValidationError);
    });

    it('throws on excessively long input', () => {
      const longEmail = 'a'.repeat(2000) + '@example.com';
      expect(() => {
        maskEmail(longEmail, { strict: true });
      }).toThrow(/exceeds maximum length/);
    });

    it('truncates long input in non-strict mode', () => {
      const longLocal = 'a'.repeat(2000);
      const result = maskEmail(`${longLocal}@example.com`);
      // Should not throw, should truncate
      expect(result.length).toBeLessThan(1100);
    });
  });

  describe('type safety', () => {
    it('accepts valid MaskOptions subset', () => {
      // Should compile without errors
      const opts: Pick<
        import('../../../src/utils/types').MaskOptions,
        'maskChar' | 'visibleStart' | 'visibleEnd'
      > = {
        maskChar: '#',
        visibleStart: 1,
        visibleEnd: 2,
      };
      expect(maskEmail('test@example.com', opts)).toMatch(/@/);
    });
  });
});
