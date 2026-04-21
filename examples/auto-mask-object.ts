import { Maskify } from '../src';

const payload = {
  user: {
    email: 'jane@company.com',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature',
  },
  payment: {
    cardNumber: '4111 1111 1111 1111',
    cvv: '123',
  },
  metadata: 'safe text',
};

const masked = Maskify.autoMask(payload, {
  sensitiveKeys: ['token', 'cvv'],
  autoDetectTypes: ['email', 'card', 'jwt'],
});

console.log(masked);
