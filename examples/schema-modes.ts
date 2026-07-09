import { Maskify, m } from '../src';

const input = {
  user: {
    id: 'u_123',
    email: 'jane@company.com',
    phone: '+14155551234',
    profile: { city: 'Berlin' },
  },
};

// 1. Modern JIT Schema + Monadic Chain (v6.0+)
const userSchema = m.object({
  user: {
    email: m.email(),
    phone: m.phone().when((_v, ctx) => ctx?.isAdmin !== true).redact('[HIDDEN_PHONE]'),
  }
});

console.log('JIT Schema Output:', userSchema(input, { isAdmin: false }));

// 2. Legacy Dot-Path Schema Modes (Still supported)
const schema = {
  'user.email': { type: 'email' as const },
  'user.phone': { type: 'phone' as const },
};

const maskMode = Maskify.maskSensitiveFields(input, schema, { mode: 'mask' });
const allowMode = Maskify.maskSensitiveFields(input, schema, {
  mode: 'allow',
  defaultMask: { type: 'generic' },
});

console.log({ maskMode, allowMode });
