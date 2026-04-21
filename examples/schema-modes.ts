import { Maskify } from '../src';

const input = {
  user: {
    id: 'u_123',
    email: 'jane@company.com',
    phone: '+14155551234',
    profile: { city: 'Berlin' },
  },
};

const schema = {
  'user.email': { type: 'email' as const },
  'user.phone': { type: 'phone' as const },
};

const maskMode = Maskify.maskSensitiveFields(input, schema, { mode: 'mask' });
const allowMode = Maskify.maskSensitiveFields(input, schema, {
  mode: 'allow',
  defaultMask: { type: 'generic' },
});

console.log({ maskMode, allowMode: JSON.stringify(allowMode) });
