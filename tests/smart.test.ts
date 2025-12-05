import { Maskify } from '../src/index';
import { GlobalConfigLoader } from '../src/utils/config';

describe('Smart Compiler (Maskify.smart)', () => {
  // 🛡️ ISOLATION
  beforeAll(() => {
    jest.spyOn(GlobalConfigLoader, 'load').mockReturnValue({});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should mask emails in a sentence', () => {
    const log = 'User john.doe@example.com logged in successfully.';
    const result = Maskify.smart(log);

    // Default email mask (visibleStart: 0) -> ****@***.com
    expect(result).toBe('User ****@***.com logged in successfully.');
  });

  it('should mask IPv4 addresses in logs', () => {
    const log = 'Connection request from 192.168.1.50 port 8080';
    const result = Maskify.smart(log);
    expect(result).toBe('Connection request from 192.168.1.*** port 8080');
  });

  it('should mask Credit Cards but ignore normal numbers', () => {
    // 16 digits = Card, 4 digits = Year/ID
    const log = 'Payment processed for card 4111 1234 5678 1234 in year 2025';
    const result = Maskify.smart(log);

    expect(result).toContain('4111 **** **** 1234');
    expect(result).toContain('2025');
  });

  it('should correctly identify and mask JWT tokens', () => {
    const jwt =
      'eyJh.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const log = `Authorization: Bearer ${jwt}`;

    const result = Maskify.smart(log);

    // Payload & Signature are long enough to hit the 10-asterisk cap
    expect(result).toContain(
      'Authorization: Bearer eyJh.**********.**********'
    );
  });

  it('should mask sensitive URL query parameters', () => {
    const url = 'Request to https://api.com?token=secret123&user=admin';
    const result = Maskify.smart(url);

    expect(result).toContain('token=********');
    expect(result).toContain('https://api.com');
  });

  it('should handle complex mixed logs with multiple PII types', () => {
    // 🛑 FIX: Use a longer JWT here so it generates 10 asterisks
    const longJwt = 'eyJh.thisisalongpayloadstring.thisisalongsignaturestring';
    const log = `Failed login: admin@test.com from IP 10.0.0.5 using token ${longJwt}`;

    const result = Maskify.smart(log);

    expect(result).toContain('****@***.com'); // Email
    expect(result).toContain('10.0.0.***'); // IP
    expect(result).toContain('eyJh.**********.**********'); // JWT
  });

  it('should respect custom mask character', () => {
    const log = 'Contact: +1-555-012-3456';
    const result = Maskify.smart(log, { maskChar: '#' });

    expect(result).toBe('Contact: +15####456');
  });

  it('should return empty string for null/undefined input', () => {
    expect(Maskify.smart(null as any)).toBe('');
    expect(Maskify.smart(undefined as any)).toBe('');
  });

  it('should leave text without PII untouched', () => {
    const safeLog = 'System started successfully. CPU usage: 45%';
    const result = Maskify.smart(safeLog);
    expect(result).toBe(safeLog);
  });
});
