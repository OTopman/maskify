import Fastify from 'fastify';
import { Maskify } from '../src';

const app = Fastify();

app.register(Maskify.middlewares.fastify, {
  fields: [
    { name: 'email', options: { type: 'email' } },
    { name: 'token', options: { type: 'generic', visibleEnd: 4 } },
  ],
});

app.get('/profile', async () => ({
  email: 'jane@company.com',
  token: 'my-sensitive-api-token',
}));
