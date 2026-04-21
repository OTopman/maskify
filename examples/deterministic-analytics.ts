import { Maskify } from '../src';

// REQUIRED — fail loudly if the secret isn't provisioned.
// Never hardcode a fallback: that defeats the point of pseudonymization,
// and anyone reading the code/commit history recovers the original PII.
const secret = process.env.MASKIFY_SECRET;
if (!secret) {
  throw new Error('MASKIFY_SECRET env var is required for deterministic masking');
}

const userEmail = 'jane@company.com';

const stableId = Maskify.deterministic(userEmail, {
  secret,
  algorithm: 'sha256', // default; switch to 'sha512' for higher collision margin
  length: 16,          // hex chars to keep — 16 ≈ 64 bits of output
});

// Same email + same secret ⇒ same stableId across processes and deploys.
console.log({ userEmail, stableId });
