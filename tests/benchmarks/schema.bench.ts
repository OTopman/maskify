import { Maskify, m } from '../../src';
const { bench } = require('mitata');

const payload = {
  id: 12345,
  user: {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    details: {
      phone: '+14155550123',
      address: '123 Main St, San Francisco, CA'
    }
  },
  orders: [
    { id: 1, card: '4111-1111-1111-1111' },
    { id: 2, card: '4222-2222-2222-2222' }
  ]
};

const legacySchema = {
  'user.name': { type: 'name' as const },
  'user.email': { type: 'email' as const },
  'user.details.phone': { type: 'phone' as const },
  'orders[*].card': { type: 'card' as const }
};

const jitSchema = m.object({
  user: {
    name: m.name(),
    email: m.email(),
    details: {
      phone: m.phone()
    }
  },
  orders: [
    {
      card: m.card()
    }
  ]
});

bench('Legacy schema masking (maskSensitiveFields)', () => {
  Maskify.maskSensitiveFields(payload, legacySchema);
});

bench('JIT compiled schema masking (m.object)', () => {
  jitSchema(payload);
});
