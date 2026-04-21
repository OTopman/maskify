import { MaskerRegistry } from '../../src/core/registry/registry';

describe('MaskerRegistry', () => {
  it('registers and retrieves maskers case-insensitively', () => {
    const r = new MaskerRegistry();
    r.register('Email', (value) => value);
    expect(r.has('email')).toBe(true);
    expect(r.get('EMAIL')).toBeDefined();
  });
});
