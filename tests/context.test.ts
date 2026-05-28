import { Maskify } from '../src';

describe('Context-Aware Masking (condition / context)', () => {
  describe('Value masking with condition', () => {
    it('should bypass masking when condition returns false', () => {
      const value = 'admin@company.com';
      const result = Maskify.mask(value, {
        type: 'email',
        condition: (val, ctx: any) => ctx?.role === 'admin' ? false : true,
        context: { role: 'admin' },
      });
      expect(result).toBe(value);
    });

    it('should apply masking when condition returns true', () => {
      const value = 'user@company.com';
      const result = Maskify.mask(value, {
        type: 'email',
        condition: (val, ctx: any) => ctx?.role === 'admin' ? false : true,
        context: { role: 'user' },
      });
      expect(result).not.toBe(value);
    });
  });

  describe('Object masking with condition and schema', () => {
    const data = {
      email: 'jane@company.com',
      phone: '+14155551234',
    };

    it('should selectively bypass masking based on context', () => {
      const schema = {
        email: {
          type: 'email' as const,
          condition: (val: string, ctx: any) => ctx?.role !== 'admin',
        },
        phone: {
          type: 'phone' as const,
          condition: (val: string, ctx: any) => ctx?.role !== 'support',
        },
      };

      // Case A: Admin should see email but phone is masked
      const adminResult = Maskify.maskSensitiveFields(data, schema, {
        context: { role: 'admin' },
      });
      expect(adminResult.email).toBe(data.email);
      expect(adminResult.phone).not.toBe(data.phone);

      // Case B: Support should see phone but email is masked
      const supportResult = Maskify.maskSensitiveFields(data, schema, {
        context: { role: 'support' },
      });
      expect(supportResult.email).not.toBe(data.email);
      expect(supportResult.phone).toBe(data.phone);
    });
  });

  describe('Async conditional masking', () => {
    it('should support async pipelines with conditions', async () => {
      const value = 'sensitive-token';
      const result = await Maskify.maskAsync(value, {
        type: 'generic',
        condition: (val, ctx: any) => ctx?.environment === 'development' ? false : true,
        context: { environment: 'development' },
      });
      expect(result).toBe(value);
    });
  });
});
