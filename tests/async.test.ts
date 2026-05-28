import { Maskify, Mask, registry } from '../src/index';

describe('Asynchronous Masking Pipeline', () => {
  describe('maskAsync', () => {
    it('masks standard PII fields asynchronously', async () => {
      const result = await Maskify.maskAsync('test@example.com', { type: 'email' });
      expect(result).not.toBe('test@example.com');
      expect(result).toContain('@');
    });

    it('works with registered custom async maskers', async () => {
      // Register custom async masker
      registry.register('asyncCustom', async (val: string) => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(`async-${val}`), 10);
        });
      });

      const result = await Maskify.maskAsync('hello', { type: 'asyncCustom' as any });
      expect(result).toBe('async-hello');
    });
  });

  describe('deterministicAsync', () => {
    it('generates consistent hashes asynchronously using WebCrypto / Node fallback', async () => {
      const secret = 'super-secret-key-of-adequate-length';
      const opts = { secret, length: 10 };

      const hash1 = await Maskify.deterministicAsync('input-data', opts);
      const hash2 = await Maskify.deterministicAsync('input-data', opts);
      const hash3 = await Maskify.deterministicAsync('other-data', opts);

      expect(hash1).toHaveLength(10);
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });
  });

  describe('maskSensitiveFieldsAsync', () => {
    it('masks object fields based on schema asynchronously', async () => {
      const data = {
        email: 'user@domain.com',
        nested: {
          phone: '1234567890',
        },
      };

      const result = await Maskify.maskSensitiveFieldsAsync(data, {
        email: { type: 'email' },
        'nested.phone': { type: 'phone' },
      });

      expect(result.email).toContain('@');
      expect(result.nested.phone).toContain('****');
    });
  });

  describe('autoMaskAsync', () => {
    it('automatically detects and masks sensitive keys asynchronously', async () => {
      const data = {
        password: 'my-secret-password',
        name: 'Normal Value',
      };

      const result = await Maskify.autoMaskAsync(data);
      expect(result.password).not.toBe('my-secret-password');
      expect(result.name).toBe('Normal Value');
    });
  });

  describe('maskClassAsync', () => {
    class MockClass {
      @Mask({ type: 'email' })
      email = 'user@domain.com';

      normal = 'hello';
    }

    it('masks decorated class instances asynchronously', async () => {
      const instance = new MockClass();
      const masked = await Maskify.maskClassAsync(instance);

      expect(masked.email).toContain('@');
      expect(masked.normal).toBe('hello');
    });
  });
});
