import { z } from 'zod';
import { zodMask, zodMaskField } from '../src/zod';

describe('Zod Schema Integration', () => {
  describe('zodMask', () => {
    it('masks fields in a validated object schema', () => {
      const userSchema = zodMask(
        z.object({
          email: z.string().email(),
          phone: z.string(),
          name: z.string(),
        }),
        {
          email: { type: 'email' },
          phone: { type: 'phone' },
        }
      );

      const rawData = {
        email: 'test.user@example.com',
        phone: '+14155552671',
        name: 'John Doe',
      };

      const parsed = userSchema.parse(rawData);

      expect(parsed.name).toBe('John Doe');
      expect(parsed.email).not.toBe(rawData.email);
      expect(parsed.email).toContain('@');
      expect(parsed.phone).not.toBe(rawData.phone);
      expect(parsed.phone).toContain('****');
    });

    it('handles nested objects and wildcard paths', () => {
      const complexSchema = zodMask(
        z.object({
          user: z.object({
            email: z.string(),
          }),
          cards: z.array(
            z.object({
              number: z.string(),
            })
          ),
        }),
        {
          'user.email': { type: 'email' },
          'cards[*].number': { type: 'card' },
        }
      );

      const rawData = {
        user: { email: 'admin@company.com' },
        cards: [{ number: '1111222233334444' }, { number: '5555666677778888' }],
      };

      const parsed = complexSchema.parse(rawData);

      expect(parsed.user.email).not.toBe('admin@company.com');
      expect(parsed.user.email).toContain('@');
      expect(parsed.cards[0].number).not.toBe('1111222233334444');
      expect(parsed.cards[0].number).toContain('****');
      expect(parsed.cards[1].number).toContain('****');
    });
  });

  describe('zodMaskField', () => {
    it('masks a single string field directly', () => {
      const schema = z.object({
        secretKey: zodMaskField({ maskChar: 'x', visibleEnd: 2 }),
      });

      const parsed = schema.parse({ secretKey: 'super-sensitive-token' });
      expect(parsed.secretKey).not.toBe('super-sensitive-token');
      expect(parsed.secretKey.endsWith('en')).toBe(true);
      expect(parsed.secretKey.startsWith('x')).toBe(true);
    });

    it('works with optional fields', () => {
      const schema = z.object({
        email: zodMaskField({ type: 'email' }).optional(),
      });

      // Present
      const parsed1 = schema.parse({ email: 'test@example.com' });
      expect(parsed1.email).toContain('@');
      expect(parsed1.email).not.toBe('test@example.com');

      // Missing
      const parsed2 = schema.parse({});
      expect(parsed2.email).toBeUndefined();
    });
  });
});
