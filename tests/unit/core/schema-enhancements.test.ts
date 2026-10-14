import { m, Maskify } from '../../../src/index';

describe('JIT Compiler Enhancements (v6.1.0)', () => {
  describe('m.array combinator', () => {
    it('should mask arrays of primitives directly and within objects', () => {
      const emailListSchema = m.array(m.email({ visibleLocalChars: 1 }));
      const result = emailListSchema(['alice@example.com', 'bob@example.com']);

      expect(result).toEqual(['a****@e***.com', 'b***@e***.com']);

      const userSchema = m.object({
        emails: m.array(m.email({ visibleLocalChars: 1 })),
      });

      const userResult = userSchema({
        emails: ['john@test.com', 'jane@test.com'],
        other: 123,
      });

      expect(userResult.emails).toEqual(['j***@t***.com', 'j***@t***.com']);
      expect(userResult.other).toBe(123);
    });

    it('should support m.array with nested object schemas', () => {
      const orderListSchema = m.array({
        card: m.card({ maskChar: '#' }),
        amount: m.generic(),
      });

      const orders = [
        { card: '1234567812345678', amount: 100 },
        { card: '8765432187654321', amount: 200 },
      ];

      const masked = orderListSchema(orders);
      expect(masked[0].card).toBe('1234 #### #### 5678');
      expect(masked[1].card).toBe('8765 #### #### 4321');
    });
  });

  describe('m.optional, m.nullable, and m.nullish', () => {
    it('m.optional should preserve undefined and mask defined values', () => {
      const schema = m.object({
        email: m.optional(m.email({ visibleLocalChars: 1 })),
        phone: m.optional(m.phone({ visibleStart: 1, visibleEnd: 1 })),
      });

      const withValues = schema({
        email: 'test@example.com',
        phone: '+1234567890',
      });
      expect(withValues.email).toBe('t***@e***.com');
      expect(withValues.phone).toBe('+1****0');

      const withUndefined = schema({
        email: undefined,
      });
      expect(withUndefined.email).toBeUndefined();
      expect(withUndefined.phone).toBeUndefined();

      const withNull = schema({
        email: null,
      });
      expect(withNull.email).toBeNull();
    });

    it('m.nullable should preserve null and mask defined values', () => {
      const schema = m.object({
        email: m.nullable(m.email({ visibleLocalChars: 1 })),
      });

      expect(schema({ email: null }).email).toBeNull();
      expect(schema({ email: undefined }).email).toBeUndefined();
      expect(schema({ email: 'test@example.com' }).email).toBe('t***@e***.com');
    });

    it('m.nullish should preserve both null and undefined', () => {
      const schema = m.object({
        email: m.nullish(m.email({ visibleLocalChars: 1 })),
      });

      expect(schema({ email: null }).email).toBeNull();
      expect(schema({ email: undefined }).email).toBeUndefined();
      expect(schema({ email: 'hello@world.com' }).email).toBe('h****@w***.com');
    });
  });

  describe('m.discriminatedUnion', () => {
    it('should dispatch to matching case based on discriminator key', () => {
      const eventSchema = m.discriminatedUnion('kind', {
        user_signup: m.object({
          email: m.email({ visibleLocalChars: 1 }),
          name: m.name(),
        }),
        payment: m.object({
          card: m.card({ maskChar: '*' }),
        }),
      });

      const userEvent = {
        kind: 'user_signup',
        email: 'alice@example.com',
        name: 'Alice Smith',
        extra: 'unaffected',
      };

      const paymentEvent = {
        kind: 'payment',
        card: '4111111111111111',
      };

      const unknownEvent = {
        kind: 'unknown_type',
        raw: 'unmodified',
      };

      expect(eventSchema(userEvent)).toEqual({
        kind: 'user_signup',
        email: 'a****@e***.com',
        name: 'A**** S****',
        extra: 'unaffected',
      });

      expect(eventSchema(paymentEvent)).toEqual({
        kind: 'payment',
        card: '4111 **** **** 1111',
      });

      expect(eventSchema(unknownEvent)).toEqual(unknownEvent);
    });

    it('should work when nested inside m.object', () => {
      const payloadSchema = m.object({
        id: '123',
        event: m.discriminatedUnion('type', {
          auth: {
            token: m.jwt(),
          },
          contact: {
            phone: m.phone({ visibleStart: 1, visibleEnd: 1 }),
          },
        }),
      });

      const result = payloadSchema({
        id: '999',
        event: {
          type: 'auth',
          token: 'header.payload.signature',
        },
      });

      expect(result.id).toBe('999');
      expect(result.event.token).toBe('header.*******.*********');
    });
  });

  describe('m.union', () => {
    it('should evaluate conditional maskers in union', () => {
      const unionMasker = m.union(
        m.email().when((val) => typeof val === 'string' && val.includes('@')),
        m.phone({ visibleStart: 1, visibleEnd: 1 }).when((val) => typeof val === 'string' && val.startsWith('+'))
      );

      expect(unionMasker('alice@test.com')).toBe('a****@t***.com');
      expect(unionMasker('+14155552671')).toBe('+1****1');
      expect(unionMasker('plain_text')).toBe('plain_text');
    });
  });

  describe('Schema Composition (.extend, .pick, .omit)', () => {
    const baseUser = m.object({
      id: m.generic(),
      email: m.email({ visibleLocalChars: 1 }),
      phone: m.phone({ visibleStart: 1, visibleEnd: 1 }),
    });

    it('.extend() should append and override schema fields', () => {
      const extendedUser = baseUser.extend({
        card: m.card(),
        phone: m.phone({ visibleStart: 2, visibleEnd: 2 }), // override
      });

      const input = {
        id: 'user_123',
        email: 'user@test.com',
        phone: '+1234567890',
        card: '4111111111111111',
      };

      const result = extendedUser(input);
      expect(result.email).toBe('u***@t***.com');
      expect(result.card).toBe('4111 **** **** 1111');
      expect(result.phone).toBe('+12****90');
    });

    it('.pick() should retain only selected schema properties', () => {
      const picked = baseUser.pick('email');

      const input = {
        id: 'secret_id',
        email: 'user@test.com',
        phone: '+1234567890',
      };

      const result = picked(input);
      expect(result.email).toBe('u***@t***.com');
      expect(result.id).toBe('secret_id'); // unmasked
      expect(result.phone).toBe('+1234567890'); // unmasked
    });

    it('.omit() should exclude specified schema properties from masking', () => {
      const omitted = baseUser.omit('phone');

      const input = {
        id: 'secret_id',
        email: 'user@test.com',
        phone: '+1234567890',
      };

      const result = omitted(input);
      expect(result.email).toBe('u***@t***.com');
      expect(result.phone).toBe('+1234567890'); // untouched
    });
  });

  describe('Async JIT Schemas (m.objectAsync and .async())', () => {
    it('should execute compiled JIT async functions with async maskers', async () => {
      const asyncUserSchema = m.objectAsync({
        email: m.email({ visibleLocalChars: 1 }),
        token: async (val: string) => `[ASYNC_HASHED_${val.length}]`,
        orders: m.array({
          card: m.card(),
          asyncTag: async (v: string) => `TAG_${v.toUpperCase()}`,
        }),
      });

      const input = {
        email: 'async@example.com',
        token: 'secret_jwt_or_key',
        orders: [
          { card: '4111111111111111', asyncTag: 'vip' },
          { card: '5555555555555555', asyncTag: 'standard' },
        ],
      };

      const result = await asyncUserSchema(input);

      expect(result.email).toBe('a****@e***.com');
      expect(result.token).toBe('[ASYNC_HASHED_17]');
      expect(result.orders[0].card).toBe('4111 **** **** 1111');
      expect(result.orders[0].asyncTag).toBe('TAG_VIP');
      expect(result.orders[1].card).toBe('5555 **** **** 5555');
      expect(result.orders[1].asyncTag).toBe('TAG_STANDARD');
    });

    it('should support .async() conversion on m.object()', async () => {
      const syncSchema = m.object({
        email: m.email(),
        secret: async (v: string) => `ENCRYPTED_${v}`,
      });

      const asyncCompiled = syncSchema.async();
      const result = await asyncCompiled({
        email: 'sync@test.com',
        secret: 'password123',
      });

      expect(result.email).toBe('s***@t***.com');
      expect(result.secret).toBe('ENCRYPTED_password123');
    });

    it('should support composition (.extend, .pick, .omit) on async schemas', async () => {
      const baseAsync = m.objectAsync({
        email: m.email({ visibleLocalChars: 1 }),
        token: async (v: string) => `TOK_${v}`,
      });

      const extended = baseAsync.extend({
        extra: async (v: string) => `EXTRA_${v}`,
      });

      const result = await extended({
        email: 'dev@test.com',
        token: 'abc',
        extra: 'xyz',
      });

      expect(result.email).toBe('d***@t***.com');
      expect(result.token).toBe('TOK_abc');
      expect(result.extra).toBe('EXTRA_xyz');

      // Test async .pick()
      const pickedAsync = baseAsync.pick('email');
      const pickedRes = await pickedAsync({
        email: 'pick@test.com',
        token: 'secret',
      });
      expect(pickedRes.email).toBe('p***@t***.com');
      expect((pickedRes as any).token).toBe('secret'); // unmasked

      // Test async .omit()
      const omittedAsync = baseAsync.omit('token');
      const omittedRes = await omittedAsync({
        email: 'omit@test.com',
        token: 'secret',
      });
      expect(omittedRes.email).toBe('o***@t***.com');
      expect((omittedRes as any).token).toBe('secret'); // untouched
    });

    it('should handle array inputs directly in m.objectAsync and edge cases', async () => {
      const asyncSchema = m.objectAsync({
        email: m.email({ visibleLocalChars: 1 }),
      });

      // Array input
      const resArray = await asyncSchema([
        { email: 'first@test.com' },
        { email: 'second@test.com' },
      ]);
      expect(resArray[0].email).toBe('f****@t***.com');
      expect(resArray[1].email).toBe('s****@t***.com');

      // Nullish inputs
      expect(await asyncSchema(null)).toBeNull();
      expect(await asyncSchema(undefined)).toBeUndefined();
      expect(await asyncSchema('not-an-object')).toBe('not-an-object');

      // Non-array passed to array field in asyncSchema
      const asyncSingle = m.objectAsync({ arr: m.array(m.email()) });
      const asyncSingleRes = await asyncSingle({ arr: 'user@test.com' });
      expect((asyncSingleRes as any).arr).toBe('u***@t***.com');
    });

    it('should cover combinator edge cases (nullish, non-objects, and callAsync)', async () => {
      // ArrayMasker callAsync and non-array input
      const arr = m.array(m.email());
      expect(arr(null)).toBeNull();
      expect(arr('not-array')).toBe('not-array');

      const asyncArrRes = await arr(['test@example.com']);
      expect(asyncArrRes).toEqual(['t***@e***.com']);

      // Direct ArrayMasker instance callAsync
      const { ArrayMasker } = require('../../../src/core/schema');
      const arrInstance = new ArrayMasker(m.email());
      expect(await arrInstance.callAsync(['hello@world.com'])).toEqual(['h****@w***.com']);
      expect(await arrInstance.callAsync(null)).toBeNull();

      const arrObjInstance = new ArrayMasker({ card: m.card() });
      const maskedCards = await arrObjInstance.callAsync([{ card: '4111111111111111' }]);
      expect(maskedCards[0].card).toBe('4111 **** **** 1111');

      // Object literal passed to optional, nullable, nullish
      const optObj = m.optional({ secret: m.generic() });
      expect(optObj(undefined)).toBeUndefined();
      expect(optObj(null)).toBeNull();
      expect(optObj({ secret: 'password' })).toEqual({ secret: '****' });

      const nullObj = m.nullable({ secret: m.generic() });
      expect(nullObj(null)).toBeNull();
      expect(nullObj(undefined)).toBeUndefined();
      expect(nullObj({ secret: 'password' })).toEqual({ secret: '****' });

      const nullishObj = m.nullish({ secret: m.generic() });
      expect(nullishObj(null)).toBeNull();
      expect(nullishObj(undefined)).toBeUndefined();
      expect(nullishObj({ secret: 'password' })).toEqual({ secret: '****' });

      // DiscriminatedUnion edge cases
      const du = m.discriminatedUnion('type', {
        a: { email: m.email() },
      });
      expect(du(null)).toBeNull();
      expect(du('primitive')).toBe('primitive');
      expect(du({ type: 'unknown', data: 123 })).toEqual({ type: 'unknown', data: 123 });

      // Union edge cases & object schemas in union
      const u = m.union(m.email());
      expect(u(null)).toBeNull();
      expect(u('no-email')).toBe('no-email');

      const objUnion = m.union({ email: m.email() }, { phone: m.phone() });
      const objUnionRes = objUnion({ email: 'test@example.com' });
      expect(objUnionRes.email).toBe('t***@e***.com');

      // Sync object edge cases
      const syncObj = m.object({ a: m.email(), list: m.array(m.email()) });
      expect(syncObj(null)).toBeNull();
      expect(syncObj(undefined)).toBeUndefined();
      expect(syncObj('primitive')).toBe('primitive');
      expect(syncObj({ a: 'u@test.com', list: 'single@test.com' }).list).toBe('s****@t***.com');
    });
  });

  describe('TypeScript m.infer type tests', () => {
    it('should infer correct TypeScript shapes', () => {
      const schema = m.object({
        email: m.email(),
        tags: m.array(m.generic()),
        optPhone: m.optional(m.phone()),
        nullableCard: m.nullable(m.card()),
      });

      type Inferred = m.infer<typeof schema>;

      const dummy: Inferred = {
        email: 'e@test.com',
        tags: ['a', 'b'],
        optPhone: undefined,
        nullableCard: null,
      };

      const result = schema(dummy);
      expect(result.email).toBe('***@t***.com');
      expect(result.tags).toEqual(['***', '***']);
    });
  });

  describe('Maskify namespace exposure', () => {
    it('should expose m via Maskify.m', () => {
      expect(Maskify.m).toBeDefined();
      expect(Maskify.m.object).toBe(m.object);
      expect(Maskify.m.array).toBe(m.array);
      expect(Maskify.m.objectAsync).toBe(m.objectAsync);
    });
  });
});
