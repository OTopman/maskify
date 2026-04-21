import {
  assertValidInput,
  validateInput,
} from '../../../src/utils/validator';
import { MaskifyValidationError } from '../../../src/utils/errors';

describe('validator', () => {
  describe('validateInput', () => {
    it('returns invalid for non-string input in non-strict mode', () => {
      const result = validateInput(10);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Expected string');
    });

    it('throws typed error for non-string input in strict mode', () => {
      expect(() => validateInput(10, { strict: true })).toThrow(
        MaskifyValidationError,
      );
    });

    it('trims string input', () => {
      expect(validateInput('  hello ').sanitized).toBe('hello');
    });

    it('truncates over-length input in non-strict mode', () => {
      const long = 'a'.repeat(2000);
      const result = validateInput(long);
      expect(result.valid).toBe(true);
      expect(result.sanitized?.length).toBe(1024);
    });

    it('throws on over-length input in strict mode', () => {
      expect(() => validateInput('a'.repeat(2000), { strict: true })).toThrow(
        /exceeds maximum length/,
      );
    });

    it('treats empty input as valid with empty sanitized value', () => {
      expect(validateInput('').sanitized).toBe('');
    });
  });

  describe('assertValidInput', () => {
    it('throws only in strict mode', () => {
      expect(() =>
        assertValidInput(123, 'test context', true),
      ).toThrow(MaskifyValidationError);
      expect(() => assertValidInput(123, 'test context')).not.toThrow();
    });
  });
});
