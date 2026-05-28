/**
 * Regression tests for issues found during production-grade audit.
 * Each describe block maps to a specific audit finding.
 */
import { Maskify } from '../src/index';
import { GlobalConfigLoader } from '../src/utils/config';
import { validateInput } from '../src/utils/validator';
import { MaskifyValidationError } from '../src/utils/errors';
import { safeClone } from '../src/utils/clone';
import { deepVisit } from '../src/core/strategies/traverser';

describe('Audit Regression Tests', () => {
  // 🛡️ ISOLATION: Ignore real maskify.config.js during tests
  beforeAll(() => {
    jest.spyOn(GlobalConfigLoader, 'load').mockReturnValue({});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // ─── SECURITY ────────────────────────────────────────────────────

  describe('Prototype Pollution Protection (traverser)', () => {
    it('should skip __proto__ keys during deep traversal', () => {
      const visited: string[] = [];
      const obj = JSON.parse('{"__proto__":{"polluted":true},"safe":"value"}');

      deepVisit(obj, (key) => {
        visited.push(key);
      });

      expect(visited).toContain('safe');
      expect(visited).not.toContain('__proto__');
      expect(visited).not.toContain('polluted');
      // Verify global Object prototype was not polluted
      expect(({} as any).polluted).toBeUndefined();
    });

    it('should skip constructor and prototype keys', () => {
      const visited: string[] = [];
      const obj = { constructor: 'bad', prototype: 'worse', normal: 'ok' };

      deepVisit(obj, (key) => {
        visited.push(key);
      });

      expect(visited).toContain('normal');
      expect(visited).not.toContain('constructor');
      expect(visited).not.toContain('prototype');
    });
  });

  describe('Circular Reference Protection', () => {
    it('deepVisit should not infinite-loop on circular objects', () => {
      const a: any = { name: 'alpha' };
      const b: any = { name: 'beta', ref: a };
      a.ref = b;

      const visited: string[] = [];
      deepVisit(a, (key) => {
        visited.push(key);
      });

      // Should visit properties of a and b but not re-enter
      expect(visited).toContain('name');
      expect(visited).toContain('ref');
      // Should terminate without throwing
    });

    it('maskSensitiveFields should handle circular references safely', () => {
      const data: any = { email: 'user@test.com', nested: {} };
      data.nested.back = data; // circular

      // Should not throw or infinite-loop
      expect(() => {
        Maskify.maskSensitiveFields(data, {
          email: { type: 'email' },
        });
      }).not.toThrow();
    });
  });

  // ─── CACHE ───────────────────────────────────────────────────────

  describe('Cache FIFO Eviction', () => {
    it('should not exceed the configured limit', () => {
      // The LimitedCache is tested via the pathCache/regexCache exports
      // We test indirectly via getCachedRegex behavior
      const { regexCache } = require('../src/utils/cache');
      regexCache.clear();

      // Fill past the limit (1000 entries)
      for (let i = 0; i < 1010; i++) {
        regexCache.set(`key-${i}`, new RegExp(`pattern-${i}`));
      }

      // The first 10 entries should have been evicted
      expect(regexCache.get('key-0')).toBeUndefined();
      expect(regexCache.get('key-9')).toBeUndefined();
      // Recent entries should still exist
      expect(regexCache.get('key-1009')).toBeDefined();
    });
  });

  describe('disableCache config option', () => {
    it('should bypass regex cache when disableCache is true', () => {
      const restoreMock = jest.spyOn(GlobalConfigLoader, 'load');
      restoreMock.mockReturnValue({ disableCache: true });

      const { getCachedRegex, regexCache } = require('../src/utils/cache');
      regexCache.clear();

      let callCount = 0;
      const creator = () => {
        callCount++;
        return /test/;
      };

      getCachedRegex('test-key', creator);
      getCachedRegex('test-key', creator);

      // Creator should be called twice because caching is disabled
      expect(callCount).toBe(2);

      // Restore
      restoreMock.mockReturnValue({});
    });
  });

  // ─── VALIDATOR ───────────────────────────────────────────────────

  describe('Validator allowEmpty fix', () => {
    it('should return invalid when allowEmpty is false and input is empty', () => {
      const result = validateInput('', { allowEmpty: false });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('should return valid when allowEmpty is true and input is empty', () => {
      const result = validateInput('', { allowEmpty: true });
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('');
    });

    it('should throw in strict mode when empty and allowEmpty is false', () => {
      expect(() =>
        validateInput('', { allowEmpty: false, strict: true }),
      ).toThrow(MaskifyValidationError);
    });

    it('default behavior (allowEmpty=false) should reject empty strings', () => {
      const result = validateInput('');
      expect(result.valid).toBe(false);
    });
  });

  // ─── CLONE ───────────────────────────────────────────────────────

  describe('safeClone prototype preservation', () => {
    it('should preserve the prototype chain of class instances', () => {
      class User {
        constructor(
          public name: string,
          public email: string,
        ) {}
        greet() {
          return `Hello, ${this.name}`;
        }
      }

      const user = new User('Alice', 'alice@example.com');
      const cloned = safeClone(user);

      expect(cloned).not.toBe(user); // different reference
      expect(cloned.name).toBe('Alice');
      expect(cloned.email).toBe('alice@example.com');
      expect(cloned instanceof User).toBe(true); // prototype preserved
      expect(cloned.greet()).toBe('Hello, Alice'); // methods work
    });

    it('should handle circular references without infinite recursion', () => {
      const obj: any = { a: 1 };
      obj.self = obj;

      const cloned = safeClone(obj);
      expect(cloned.a).toBe(1);
      expect(cloned.self).toBe(cloned); // circular ref points to clone, not original
    });

    it('should deep-clone nested Maps and Sets', () => {
      const original = {
        map: new Map([['key', 'value']]),
        set: new Set([1, 2, 3]),
      };

      const cloned = safeClone(original);

      expect(cloned.map).not.toBe(original.map);
      expect(cloned.map.get('key')).toBe('value');
      expect(cloned.set).not.toBe(original.set);
      expect(cloned.set.has(2)).toBe(true);
    });
  });

  // ─── PATTERN MASKER ──────────────────────────────────────────────

  describe('Pattern mask expansion safety limits', () => {
    it('should reject extremely large repeat counts with a RangeError', () => {
      // Safety limit: repeat counts >1000 are rejected to prevent resource exhaustion
      expect(() => {
        Maskify.pattern('1234567890', '*{999999}');
      }).toThrow(RangeError);
    });

    it('should handle normal repeat counts correctly', () => {
      const result = Maskify.pattern('1234567890', '#{2}*{3}#{5}');
      // ##{2} = show 2, *{3} = mask 3, #{5} = show 5
      expect(result.length).toBe(10);
    });
  });

  // ─── URL MASKER ──────────────────────────────────────────────────

  describe('URL masker edge cases', () => {
    it('should mask credentials in URLs', () => {
      const url = 'https://admin:secretpass@api.example.com/data';
      const result = Maskify.mask(url, { type: 'url' });

      // Should not contain the plain-text password
      expect(result).not.toContain('secretpass');
    });

    it('should handle query-string-only sensitive params', () => {
      const url = 'https://api.example.com?apiKey=my-secret-key&page=1';
      const result = Maskify.mask(url, { type: 'url' });

      expect(result).not.toContain('my-secret-key');
      expect(result).toContain('page=1');
    });
  });

  // ─── SMART MASKER (Unicode) ──────────────────────────────────────

  describe('SmartMasker Unicode name support', () => {
    it('should detect and mask names with accented characters', () => {
      const result = Maskify.smart('Contact: José García at jose@test.com');

      // The email should be masked
      expect(result).not.toContain('jose@test.com');
    });
  });

  // ─── TYPE NARROWING ──────────────────────────────────────────────

  describe('autoMask return type narrowing', () => {
    it('should return a single object when given a single object', () => {
      const input = { email: 'test@example.com', password: 'secret' };
      const result = Maskify.autoMask(input);

      // Should be a single object, not an array
      expect(Array.isArray(result)).toBe(false);
      expect(typeof result).toBe('object');
    });

    it('should return an array when given an array', () => {
      const input = [
        { email: 'a@b.com', token: 'abc' },
        { email: 'c@d.com', token: 'xyz' },
      ];
      const result = Maskify.autoMask(input);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });
  });

  describe('maskSensitiveFields return type narrowing', () => {
    it('should return a single object when given a single object', () => {
      const input = { email: 'test@example.com' };
      const result = Maskify.maskSensitiveFields(input, {
        email: { type: 'email' },
      });

      expect(Array.isArray(result)).toBe(false);
    });

    it('should return an array when given an array', () => {
      const input = [{ email: 'a@b.com' }, { email: 'c@d.com' }];
      const result = Maskify.maskSensitiveFields(input, {
        '[*].email': { type: 'email' },
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ─── ALLOW STRATEGY REGEX ───────────────────────────────────────

  describe('Allow strategy regex escaping', () => {
    it('should not choke on schema keys with special regex characters', () => {
      const data = {
        'user(admin)': 'sensitive',
        'config[0]': 'also-sensitive',
        safe: 'visible',
      };

      // Using a schema key with parentheses that would break an unescaped regex
      expect(() => {
        Maskify.maskSensitiveFields(
          data,
          { safe: {} },
          { mode: 'allow' },
        );
      }).not.toThrow();
    });
  });
});
