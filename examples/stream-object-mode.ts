import { createMaskStream } from '../src/stream';

const stream = createMaskStream(
  {
    'user.email': { type: 'email' },
    'user.phone': { type: 'phone' },
  },
  { mode: 'mask' },
);

stream.on('data', (chunk) => console.log(chunk));
stream.write({
  user: { email: 'jane@company.com', phone: '+14155551234', role: 'admin' },
});
stream.end();
