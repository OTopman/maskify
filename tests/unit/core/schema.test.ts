import { m } from '../../../src/index';

describe('Elite Schema Compiler & Monadic Maskers', () => {
  it('should mask flat objects correctly using JIT-compiled schemas', () => {
    const schema = m.object({
      name: m.email().redact('[NAME_CONFIDENTIAL]'), // Chainable redact
      email: m.email({ visibleLocalChars: 2 }),
      phone: m.phone({ visibleStart: 1, visibleEnd: 1 }),
    });

    const input = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
    };

    const result = schema(input);

    expect(result.name).toBe('[NAME_CONFIDENTIAL]');
    expect(result.email).toBe('jo****@e***.com');
    // visibleStart: 1, visibleEnd: 1
    expect(result.phone).toBe('+1****0');
  });

  it('should mask nested objects correctly', () => {
    const schema = m.object({
      user: {
        email: m.email({ visibleLocalChars: 1 }),
        card: m.card({ maskChar: '#' }),
      },
    });

    const input = {
      user: {
        email: 'test@example.com',
        card: '1234 5678 1234 5678',
      },
      unmaskedField: 'keep_me_as_is',
    };

    const result = schema(input);

    expect(result.user.email).toBe('t***@e***.com');
    expect(result.user.card).toBe('1234 #### #### 5678');
    expect(result.unmaskedField).toBe('keep_me_as_is');
  });

  it('should support monadic conditional masking via when()', () => {
    const schema = m.object({
      secretKey: m.email().when((_val, ctx) => ctx?.isAdmin !== true).redact(),
    });

    const adminCtx = { isAdmin: true };
    const guestCtx = { isAdmin: false };

    const input = { secretKey: 'admin@key.com' };

    // Should skip redact since condition is false for admins
    const adminResult = schema(input, adminCtx);
    expect(adminResult.secretKey).toBe('a****@k**.com'); // standard email mask

    // Should execute redact for guests
    const guestResult = schema(input, guestCtx);
    expect(guestResult.secretKey).toBe('[REDACTED]');
  });

  it('should support monadic transform() chain', () => {
    const schema = m.object({
      email: m.email({ visibleLocalChars: 1 }).transform((val) => val.toUpperCase()),
    });

    const input = { email: 'john@example.com' };
    const result = schema(input);

    expect(result.email).toBe('J***@E***.COM');
  });

  it('should support array inputs mapping the schema across all elements', () => {
    const schema = m.object({
      email: m.email({ visibleLocalChars: 1 }),
    });

    const input = [
      { email: 'john@example.com' },
      { email: 'jane@example.com' },
    ];

    const result = schema(input);

    expect(Array.isArray(result)).toBe(true);
    expect(result[0].email).toBe('j***@e***.com');
    expect(result[1].email).toBe('j***@e***.com');
  });

  it('should mask using remaining schema maskers correctly', () => {
    const schema = m.object({
      addr: m.address(),
      ip: m.ip(),
      token: m.jwt(),
      fullName: m.name(),
      website: m.url(),
      generic: m.generic({ visibleStart: 2, visibleEnd: 2 }),
      code: m.pattern({ pattern: '##-**-##' }),
    });

    const input = {
      addr: '123 Main Street',
      ip: '192.168.1.50',
      token: 'header.payload.signature',
      fullName: 'John Doe',
      website: 'https://example.com/api?token=secret',
      generic: 'abcdefgh',
      code: '12345678',
    };

    const result = schema(input);

    expect(result.addr).toBe('*** M**n S****t');
    expect(result.ip).toBe('192.168.1.***');
    expect(result.token).toBe('header.*******.*********');
    expect(result.fullName).toBe('J*** D**');
    expect(result.website).toBe('https://example.com/api?token=********');
    expect(result.generic).toBe('ab****gh');
    expect(result.code).toBe('12-**-56**');
  });

  it('should support nested arrays of primitive values and nested arrays of objects', () => {
    const schema = m.object({
      user: {
        emails: m.email(),
        family: {
          members: [
            {
              email: m.email({ visibleLocalChars: 1 }),
              card: m.card({ maskChar: '#' }),
            }
          ]
        }
      }
    });

    const input = {
      user: {
        emails: ['test1@example.com', 'test2@example.com'],
        family: {
          members: [
            { email: 'member1@example.com', card: '1234123412341234' },
            { email: 'member2@example.com', card: '5678567856785678' }
          ]
        }
      }
    };

    const result = schema(input);

    expect(result.user.emails).toEqual(['t****@e***.com', 't****@e***.com']);
    expect(result.user.family.members[0].email).toBe('m****@e***.com');
    expect(result.user.family.members[0].card).toBe('1234 #### #### 1234');
    expect(result.user.family.members[1].email).toBe('m****@e***.com');
    expect(result.user.family.members[1].card).toBe('5678 #### #### 5678');
  });
});
