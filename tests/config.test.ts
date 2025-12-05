import { Maskify } from '../src/index';
import { GlobalConfigLoader } from '../src/utils/config';

// We do NOT mock 'fs' here. Instead, we mock the global loader itself
// to bypass file system access, ensuring reliability.

describe('Global Configuration Integration', () => {
  let loadSpy: jest.SpyInstance;

  beforeAll(() => {
    // Spy on the static load method to allow us to control its return value
    loadSpy = jest.spyOn(GlobalConfigLoader, 'load');
  });

  afterEach(() => {
    loadSpy.mockClear();
    GlobalConfigLoader.reload(); // Ensure the global cache is reset
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should use default values when no config file exists', () => {
    // Force the loader to return an empty object, simulating config absence
    loadSpy.mockReturnValue({});

    // The default implementation should result in ****@***.com
    const result = Maskify.mask('user@test.com', { type: 'email' });
    expect(result).toBe('****@***.com');
  });

  it('should load global options from config file', () => {
    // 1. Force loader to return custom options (maskChar: #, maxAsterisks: 5)
    loadSpy.mockReturnValue({
      maskOptions: {
        maskChar: '#',
        maxAsterisks: 5,
      },
    });

    const genericResult = Maskify.mask('password123', { type: 'generic' });

    // Expect 5 hashes: # should override *, and 5 should override 4
    expect(genericResult).toContain('#####');
    expect(genericResult).not.toContain('*');
  });

  it('should allow user options to override global config', () => {
    // 1. Force loader to return custom options (maskChar: #)
    loadSpy.mockReturnValue({
      maskOptions: { maskChar: '#' },
    });

    // 2. User Option: maskChar = '$' should override global '#'
    const result = Maskify.mask('secret', { maskChar: '$', type: 'generic' });

    expect(result).toContain('$');
    expect(result).not.toContain('#');
  });

  it('should apply global config to autoMask', () => {
    // 1. Force loader to return a custom sensitive key list
    loadSpy.mockReturnValue({
      maskOptions: {
        sensitiveKeys: ['fruit'], // Custom sensitive key
      },
    });

    const data = { fruit: 'apple' };
    const masked = Maskify.autoMask(data) as any;

    // 'fruit' should be masked because global config was applied to autoMask logic
    expect(masked.fruit).not.toBe('apple');
    expect(masked.fruit).toContain('*');
  });
});
