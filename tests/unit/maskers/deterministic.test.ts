import { maskDeterministic } from '../../../src/maskers/deterministic';
import { MaskifyConfigError } from '../../../src/utils/errors';

describe('maskDeterministic', () => {
  const SECRET = 'test-secret-key-12345678'; // 24 chars, meets min length

  describe('basic functionality', () => {
    it('produces consistent output for same input+secret', () => {
      const input = 'user@example.com';
      const opts = { secret: SECRET };

      const hash1 = maskDeterministic(input, opts);
      const hash2 = maskDeterministic(input, opts);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[0-9a-f]+$/);
    });

    it('produces different output for different inputs', () => {
      const opts = { secret: SECRET };

      const hash1 = maskDeterministic('user1@example.com', opts);
      const hash2 = maskDeterministic('user2@example.com', opts);

      expect(hash1).not.toBe(hash2);
    });

    it('respects length option', () => {
      const result = maskDeterministic('test@example.com', {
        secret: SECRET,
        length: 8,
      });
      expect(result).toHaveLength(8);
    });

    it('supports sha512 algorithm', () => {
      const result = maskDeterministic('test@example.com', {
        secret: SECRET,
        algorithm: 'sha512',
      });
      expect(result).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('security requirements', () => {
    it('REQUIRES secret parameter - no default', () => {
      expect(() => {
        // @ts-expect-error testing missing secret
        maskDeterministic('test@example.com', {});
      }).toThrow(MaskifyConfigError);
    });

    it('rejects secrets shorter than 16 chars', () => {
      expect(() => {
        maskDeterministic('test@example.com', { secret: 'short' });
      }).toThrow(/at least 16 characters/);
    });

    it('rejects empty secret', () => {
      expect(() => {
        maskDeterministic('test@example.com', { secret: '' });
      }).toThrow(MaskifyConfigError);
    });
  });

  describe('input validation', () => {
    it('throws on non-string input in strict scenarios', () => {
      expect(() => {
        // @ts-expect-error testing invalid type
        maskDeterministic(12345, { secret: SECRET });
      }).toThrow(TypeError);
    });

    it('rejects excessively long input', () => {
      const longInput = 'a'.repeat(2000);
      expect(() => {
        maskDeterministic(longInput, { secret: SECRET });
      }).toThrow(/exceeds maximum length/);
    });
  });

  describe('real-world usage', () => {
    it('can be used for analytics without storing PII', () => {
      const users = [
        'alice@company.com',
        'bob@company.com',
        'alice@company.com', // duplicate
      ];

      const hashes = users.map((email) =>
        maskDeterministic(email, { secret: SECRET, length: 12 }),
      );

      // Unique count without storing emails
      const uniqueUsers = new Set(hashes).size;
      expect(uniqueUsers).toBe(2);
    });

    it('works with environment variable pattern', () => {
      // Simulate env var usage
      process.env.MASKIFY_SECRET = SECRET;

      const result = maskDeterministic('test@example.com', {
        secret: process.env.MASKIFY_SECRET!,
      });

      expect(result).toMatch(/^[0-9a-f]{12}$/);

      delete process.env.MASKIFY_SECRET;
    });
  });
});
