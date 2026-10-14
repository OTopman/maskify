import { m, Maskify, maskSecret } from '../../../src/index';

describe('Secret Masker', () => {
  const awsKey = 'AKIAIOSFODNN7EXAMPLE';
  const githubPat = 'ghp_1234567890abcdefghijklmnopqrstuvwxyz';
  const stripeKey = 'sk_test_51Abcdef1234567890abcdef12345';
  const bearerToken = 'Bearer my-secret-auth-token-1234567';
  const privateKey = '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...';

  describe('maskSecret (direct call)', () => {
    it('should mask AWS Access Key preserving AKIA prefix', () => {
      const masked = maskSecret(awsKey);
      expect(masked).toBe('AKIA****************');
    });

    it('should mask GitHub PAT preserving ghp_ prefix', () => {
      const masked = maskSecret(githubPat);
      expect(masked).toBe('ghp_************************************');
    });

    it('should mask Stripe key preserving sk_test_ prefix', () => {
      const masked = maskSecret(stripeKey);
      expect(masked).toBe('sk_test_*****************************');
    });

    it('should mask Bearer token preserving Bearer prefix', () => {
      const masked = maskSecret(bearerToken);
      expect(masked).toBe('Bearer ****************************');
    });

    it('should redact private key blocks', () => {
      const masked = maskSecret(privateKey);
      expect(masked).toBe('[REDACTED_PRIVATE_KEY]');
    });

    it('should mask unknown secret keys keeping first 4 chars by default', () => {
      const customKey = 'random_secret_string_123456789';
      const masked = maskSecret(customKey);
      expect(masked).toBe('rand**************************');
    });

    it('should respect custom visibleStart and visibleEnd', () => {
      const masked = maskSecret(awsKey, { visibleStart: 0, visibleEnd: 4 });
      expect(masked).toBe('AKIA************MPLE');
    });

    it('should respect keepPrefix: false', () => {
      const masked = maskSecret(awsKey, { keepPrefix: false, visibleStart: 2 });
      expect(masked).toBe('AK******************');
    });

    it('should handle empty input', () => {
      expect(maskSecret('')).toBe('');
    });
  });

  describe('m.secret schema builder', () => {
    it('should work with m.object schemas', () => {
      const schema = m.object({
        key: m.secret(),
      });

      expect(schema({ key: awsKey })).toEqual({ key: 'AKIA****************' });
    });

    it('should be exposed on Maskify namespace', () => {
      expect(Maskify.secret(githubPat)).toBe('ghp_************************************');
    });
  });
});
