import { Maskify, m } from '../src';

const raw = {
  email: 'jane@company.com',
  phone: '+1 (415) 555-1234',
  card: '4111 1111 1111 1111',
};

// 1. New v6.0 JIT-compiled Schema Builder API (Recommended)
const userSchema = m.object({
  email: m.email(),
  phone: m.phone(),
  card: m.card(),
});

console.log('JIT Compiled Schema Output:', userSchema(raw));

// 2. Legacy Direct API (Still supported)
const maskedLegacy = {
  email: Maskify.mask(raw.email, { type: 'email' }),
  phone: Maskify.mask(raw.phone, { type: 'phone' }),
  card: Maskify.mask(raw.card, { type: 'card' }),
  customPattern: Maskify.pattern('ABCD-1234-EFGH', '##**-****-####'),
};

console.log('Legacy Direct API Output:', maskedLegacy);
