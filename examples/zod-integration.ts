// Make sure to run standard ts-node/transpile to check this
import { z } from 'zod';
import { zodMask, zodMaskField } from '../src/zod';

// 1. Define object schema with custom fields to mask
const userSchema = zodMask(
  z.object({
    email: z.string().email(),
    phone: z.string(),
    role: z.string(),
  }),
  {
    email: { type: 'email' },
    phone: { type: 'phone' },
  }
);

const rawUser = {
  email: 'jane.doe@company.com',
  phone: '+14155551234',
  role: 'admin',
};

const parsedUser = userSchema.parse(rawUser);
console.log('Parsed User:', parsedUser);
// Expected: { email: 'j*******e@c******y.com', phone: '+**********1234', role: 'admin' }

// 2. Define custom pre-masked string fields
const apiPayloadSchema = z.object({
  apiKey: zodMaskField({ maskChar: '•', visibleEnd: 4 }),
  secretValue: zodMaskField({ type: 'generic' }).optional(),
});

const parsedPayload = apiPayloadSchema.parse({
  apiKey: 'sk-live-1234567890abcdef',
  secretValue: 'super-sensitive-secret-token',
});

console.log('Parsed API Payload:', parsedPayload);
// Expected: { apiKey: '••••••••••••••••••••cdef', secretValue: 's**************************n' }
