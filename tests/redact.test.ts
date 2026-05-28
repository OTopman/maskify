import { Maskify } from '../src';

describe('Data Redaction & Classification Labels (redact / label)', () => {
  describe('Value redaction', () => {
    it('should replace email with [REDACTED_EMAIL]', () => {
      const email = 'test@example.com';
      const result = Maskify.mask(email, { type: 'email', redact: true });
      expect(result).toBe('[REDACTED_EMAIL]');
    });

    it('should replace phone with [REDACTED_PHONE]', () => {
      const phone = '+14155551234';
      const result = Maskify.mask(phone, { type: 'phone', redact: true });
      expect(result).toBe('[REDACTED_PHONE]');
    });

    it('should fallback to [REDACTED] for generic type', () => {
      const value = 'some-random-text';
      const result = Maskify.mask(value, { redact: true });
      expect(result).toBe('[REDACTED]');
    });

    it('should use custom label when provided', () => {
      const value = 'my-secret-key';
      const result = Maskify.mask(value, { redact: true, label: '[CONFIDENTIAL]' });
      expect(result).toBe('[CONFIDENTIAL]');
    });

    it('should respect auto-detected type for redaction labels', () => {
      const email = 'detectable@email.com';
      const result = Maskify.mask(email, { redact: true, autoDetect: true });
      expect(result).toBe('[REDACTED_EMAIL]');
    });
  });

  describe('Nested field redaction via schema', () => {
    it('should redact fields in an object schema', () => {
      const data = {
        user: {
          email: 'jane@company.com',
          phone: '+14155552222',
          role: 'admin',
        },
      };

      const result = Maskify.maskSensitiveFields(data, {
        'user.email': { redact: true, type: 'email' },
        'user.phone': { redact: true, label: '[CONTACT_INFO]' },
      });

      expect(result.user.email).toBe('[REDACTED_EMAIL]');
      expect(result.user.phone).toBe('[CONTACT_INFO]');
      expect(result.user.role).toBe('admin');
    });
  });
});
