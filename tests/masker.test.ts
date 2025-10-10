import { Maskify } from '../src/maskify';

describe('Maskify Utility', () => {
  describe('Maskify.mask()', () => {
    it('should mask an email correctly', () => {
      const masked = Maskify.mask('john.doe@example.com', {
        type: 'email',
        visibleStart: 2,
        visibleEnd: 1,
      });
      expect(masked).toMatch(/^jo\*+@e\*+\.com$/);
    });

    it('should mask a phone number correctly', () => {
      const masked = Maskify.mask('+2348012345678', { type: 'phone' });
      expect(masked.startsWith('+23')).toBe(true);
      expect(masked.endsWith('78')).toBe(true);
    });

    it('should mask a card number correctly', () => {
      const masked = Maskify.mask('1234567812345678', { type: 'card' });
      expect(masked).toMatch(/^\d{4}\s\*{4}\s\*{4}\s\d{4}$/);
    });

    it('should mask a generic string correctly', () => {
      const masked = Maskify.mask('SensitiveValue', { type: 'generic' });
      expect(masked.length).not.toBe('SensitiveValue'.length);
      expect(masked).not.toBe('SensitiveValue');
    });

    it('should auto-detect email type', () => {
      const masked = Maskify.mask('jane@doe.com', { autoDetect: true });
      expect(masked.includes('@')).toBe(true);
      expect(masked).not.toBe('jane@doe.com');
    });

    it('should use a custom mask character', () => {
      const masked = Maskify.mask('09012345678', {
        type: 'phone',
        maskChar: '#',
      });
      expect(masked.includes('#')).toBe(true);
    });

    it('should return the same value for empty or null input', () => {
      expect(Maskify.mask('')).toBe('');
      expect(Maskify.mask(null as any)).toBeNull();
    });
  });

  describe('Maskify.maskSensitiveFields()', () => {
    const sample = {
      user: {
        email: 'john@example.com',
        phone: '+2348012345678',
        card: '1234567812345678',
        nested: {
          password: 'SuperSecret123',
        },
      },
      list: [
        { email: 'a@b.com', phone: '08011112222' },
        { email: 'c@d.com', phone: '08033334444' },
      ],
    };

    it('should mask multiple fields using schema', () => {
      const masked = Maskify.maskSensitiveFields<typeof sample>(sample, {
        'user.email': { type: 'email' },
        'user.phone': { type: 'phone' },
        'user.nested.password': { type: 'generic' },
      }) as typeof sample;

      expect(masked.user.email).not.toBe(sample.user.email);
      expect(masked.user.phone).not.toBe(sample.user.phone);
      expect(masked.user.nested.password).not.toBe(sample.user.nested.password);
    });

    it('should handle wildcard paths', () => {
      const masked = Maskify.maskSensitiveFields<typeof sample>(sample, {
        'list[*].email': { type: 'email' },
        'list[*].phone': { type: 'phone' },
      }) as typeof sample;

      masked.list.forEach((item, i) => {
        expect(item.email).not.toBe(sample.list[i].email);
        expect(item.phone).not.toBe(sample.list[i].phone);
      });
    });

    it('should leave unlisted paths unchanged', () => {
      const masked = Maskify.maskSensitiveFields<typeof sample>(sample, {
        'user.email': { type: 'email' },
      }) as typeof sample;
      expect(masked.user.phone).toBe(sample.user.phone);
      expect(masked.list).toEqual(sample.list);
    });

    it('should handle missing paths gracefully', () => {
      const masked = Maskify.maskSensitiveFields(sample, {
        'nonexistent.field': { type: 'email' },
      });
      expect(masked).toEqual(sample);
    });

    it('should be non-mutating (return deep clone)', () => {
      const deepClone = (o: any) => JSON.parse(JSON.stringify(o));
      const copy = deepClone(sample);
      Maskify.maskSensitiveFields(sample, { 'user.email': { type: 'email' } });
      expect(sample).toEqual(copy);
    });

    it('should handle deeply nested arrays', () => {
      const data = {
        groups: [
          { users: [{ email: 'alpha@omega.com' }, { email: 'b@b.com' }] },
          { users: [{ email: 'c@c.com' }] },
        ],
      };

      const masked = Maskify.maskSensitiveFields(data, {
        'groups[*].users[*].email': { type: 'email' },
      }) as typeof data;

      // ✅ Masked emails should differ from originals
      expect(masked.groups[0].users[0].email).not.toBe('alpha@omega.com');
      expect(masked.groups[0].users[1].email).not.toBe('b@b.com');
      expect(masked.groups[1].users[0].email).not.toBe('c@c.com');

      // ✅ Ensure overall structure is preserved
      expect(masked.groups).toHaveLength(2);
      expect(masked.groups[0].users).toHaveLength(2);
      expect(masked.groups[1].users).toHaveLength(1);
    });
  });
});
