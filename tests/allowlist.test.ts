import { Maskify } from '../src/index';

describe('Allowlist Strategy', () => {
  const data = {
    id: 101,
    meta: { version: '1.0', timestamp: 123456789 },
    user: {
      email: 'test@example.com',
      password: 'secret-password',
      profile: {
        name: 'John',
        bio: 'Hello world',
      },
    },
  };

  it('should mask everything NOT in the schema', () => {
    const result = Maskify.maskSensitiveFields(
      data,
      {
        id: {},
        'meta.version': {},
      },
      { mode: 'allow' }
    ) as typeof data;

    // Allowed fields remain
    expect(result.id).toBe(101);
    expect(result.meta.version).toBe('1.0');

    // Everything else should be masked
    expect(result.user.email).not.toBe('test@example.com');
    expect(result.user.password).not.toBe('secret-password');
    expect(result.meta.timestamp).not.toBe(123456789);
  });

  it('should support wildcards in allowlist', () => {
    const result = Maskify.maskSensitiveFields(
      data,
      {
        'user.*': {}, // Allow direct children of user
      },
      { mode: 'allow' }
    ) as typeof data;

    expect(result.user.email).toBe('test@example.com');
    expect(result.user.password).toBe('secret-password');

    // Nested under profile should still be masked because wildcard is shallow?
    // Depending on your wildcard regex implementation in allow-strategy.
    // Based on provided regex logic: 'user.*' matches 'user.email' but not 'user.profile.name'
    expect(result.user.profile.name).not.toBe('John');
  });
});
