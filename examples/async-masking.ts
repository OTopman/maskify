import { Maskify, Mask } from '../src';

// Example secret for deterministic masking
process.env.MASKIFY_SECRET = 'super-secure-analytics-key-value';

class AccountDTO {
  @Mask({ type: 'email' })
  email = 'john.doe@domain.com';

  @Mask({ type: 'phone' })
  phone = '+14155556789';
}

async function run() {
  console.log('--- 1. Asynchronous Value Masking ---');
  const email = 'admin@company.com';
  const maskedEmail = await Maskify.maskAsync(email, { type: 'email' });
  console.log('Original:', email);
  console.log('Masked:', maskedEmail);

  console.log('\n--- 2. WebCrypto Deterministic Masking ---');
  const rawId = 'user-12345';
  const pseudonym = await Maskify.deterministicAsync(rawId, {
    secret: process.env.MASKIFY_SECRET!,
    length: 16,
  });
  console.log('Raw ID:', rawId);
  console.log('Pseudonym (consistent & non-reversible):', pseudonym);

  console.log('\n--- 3. Asynchronous Class Property Masking ---');
  const account = new AccountDTO();
  const maskedAccount = await Maskify.maskClassAsync(account);
  console.log('Masked Class Instance:', maskedAccount);

  console.log('\n--- 4. Asynchronous Nested Field Masking ---');
  const payload = {
    user: {
      email: 'jane@company.com',
      nested: {
        pin: '1234',
      },
    },
  };
  const maskedPayload = await Maskify.maskSensitiveFieldsAsync(payload, {
    'user.email': { type: 'email' },
    'user.nested.pin': { type: 'generic', maxAsterisks: 4 },
  });
  console.log('Masked Nested Payload:', JSON.stringify(maskedPayload, null, 2));
}

run().catch(console.error);
