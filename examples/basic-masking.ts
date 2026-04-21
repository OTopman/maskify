import { Maskify } from '../src';

const raw = {
  email: 'jane@company.com',
  phone: '+1 (415) 555-1234',
  card: '4111 1111 1111 1111',
};

const masked = {
  email: Maskify.mask(raw.email, { type: 'email' }),
  phone: Maskify.mask(raw.phone, { type: 'phone' }),
  card: Maskify.mask(raw.card, { type: 'card' }),
  customPattern: Maskify.pattern('ABCD-1234-EFGH', '##**-****-####'),
};

console.log(masked);
