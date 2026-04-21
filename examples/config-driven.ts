import { Maskify, defineConfig } from '../src';

// In real projects, place this in maskify.config.ts at project root.
export default defineConfig({
  mode: 'mask',
  fields: [
    { name: 'email', options: { type: 'email' } },
    { name: 'token', options: { type: 'generic', visibleEnd: 4 } },
  ],
  maskOptions: {
    maskChar: '*',
    autoDetect: true,
  },
});

const response = {
  email: 'jane@company.com',
  token: 'abcdef123456789',
  status: 'ok',
};

const masked = Maskify.maskSensitiveFields(
  response,
  {
    email: { type: 'email' },
    token: { type: 'generic', visibleEnd: 4 },
  },
  { mode: 'mask' },
);

console.log({ response, masked });
