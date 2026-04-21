import fc from 'fast-check';
import { Maskify } from '../../src';
import { maskDeterministic } from '../../src/maskers/deterministic';
import { GlobalConfigLoader } from '../../src/utils/config';

describe('masking invariants (fast-check)', () => {
  beforeAll(() => {
    jest.spyOn(GlobalConfigLoader, 'load').mockReturnValue({});
  });
  afterAll(() => jest.restoreAllMocks());

  it('mask() output is always a string for any string input', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 200 }), (input) => {
        const out = Maskify.mask(input);
        expect(typeof out).toBe('string');
      }),
    );
  });

  it('maskSensitiveFields never throws on arbitrary flat records', () => {
    fc.assert(
      fc.property(
        fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.string()),
        (obj) => {
          const schema = Object.fromEntries(
            Object.keys(obj).map((k) => [k, { type: 'generic' as const }]),
          );
          expect(() => Maskify.maskSensitiveFields(obj, schema)).not.toThrow();
        },
      ),
    );
  });

  it('deterministic mask is stable: same input+secret yields same output', () => {
    const secret = 'my-test-secret-key-1234567890';
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 100 }), (input) => {
        const a = maskDeterministic(input, { secret, length: 16 });
        const b = maskDeterministic(input, { secret, length: 16 });
        expect(a).toBe(b);
        expect(a).toMatch(/^[0-9a-f]{16}$/);
      }),
    );
  });

  it('autoMask preserves object shape (keys) for flat records', () => {
    fc.assert(
      fc.property(
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 10 }),
          fc.oneof(fc.string(), fc.integer(), fc.boolean()),
        ),
        (obj) => {
          const masked = Maskify.autoMask(obj) as Record<string, unknown>;
          expect(Object.keys(masked).sort()).toEqual(Object.keys(obj).sort());
        },
      ),
    );
  });
});
