import { Maskify } from '../src/index';

describe('New Masking Features', () => {
  describe('IP Masking', () => {
    it('should mask IPv4 correctly', () => {
      const result = Maskify.mask('192.168.1.50', { type: 'ip' });
      expect(result).toBe('192.168.1.***');
    });

    it('should mask IPv6 correctly', () => {
      const result = Maskify.mask('2001:0db8:85a3:0000:0000:8a2e:0370:7334', {
        type: 'ip',
      });
      expect(result).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:****');
    });

    it('should handle invalid IPs gracefully', () => {
      const result = Maskify.mask('not-an-ip', { type: 'ip' });
      expect(result).toBe('not-an-ip');
    });
  });

  describe('JWT Masking', () => {
    const sampleJwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

    it('should mask payload and signature but keep header', () => {
      const result = Maskify.mask(sampleJwt, { type: 'jwt' });
      const parts = result.split('.');

      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'); // Header intact
      expect(parts[1]).toContain('*'); // Payload masked
      expect(parts[2]).toContain('*'); // Signature masked
    });

    it('should return original string if not a valid JWT', () => {
      const result = Maskify.mask('invalid-token', { type: 'jwt' });
      expect(result).toBe('invalid-token');
    });
  });

  describe('URL Parameter Masking', () => {
    it('should mask sensitive query parameters', () => {
      const url = 'https://api.example.com/v1/login?token=abc12345&user=admin';
      const result = Maskify.mask(url, { type: 'url' });

      expect(result).toContain('token=********');
      expect(result).toContain('user=admin'); // 'user' is not in default sensitive list
    });

    it('should handle malformed URLs', () => {
      const result = Maskify.mask('not a url', { type: 'url' });
      expect(result).toBe('not a url');
    });
  });

  describe('Deterministic Masking', () => {
    it('should produce the same mask for the same input', () => {
      const email = 'unique@user.com';
      const opts = { secret: 'my-secret-key' };

      const mask1 = Maskify.deterministic(email, opts);
      const mask2 = Maskify.deterministic(email, opts);

      expect(mask1).toBe(mask2);
      expect(mask1).not.toBe(email);
    });

    it('should produce different masks for different secrets', () => {
      const val = 'data';
      const mask1 = Maskify.deterministic(val, { secret: 'key-A' });
      const mask2 = Maskify.deterministic(val, { secret: 'key-B' });

      expect(mask1).not.toBe(mask2);
    });
  });
});
