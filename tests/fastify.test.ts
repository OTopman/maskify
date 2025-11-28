import Fastify, { FastifyInstance } from 'fastify';
import { Maskify } from '../src/index';

describe('Fastify Middleware', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = Fastify();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should mask sensitive fields in response', async () => {
    // Register middleware
    Maskify.use(
      app,
      {
        fields: ['email', 'password'],
        maskOptions: { maskChar: '*' },
      },
      'fastify'
    );

    app.get('/', async () => {
      return { email: 'test@example.com', password: '123', public: 'hello' };
    });

    const response = await app.inject({
      method: 'GET',
      url: '/',
    });

    const body = JSON.parse(response.payload);
    expect(body.email).not.toBe('test@example.com');
    expect(body.password).not.toBe('123');
    expect(body.public).toBe('hello');
  });

  it('should handle nested fields configuration', async () => {
    Maskify.use(
      app,
      {
        fields: [{ name: 'user.phone', options: { type: 'phone' } }],
      },
      'fastify'
    );

    app.get('/nested', async () => {
      return { user: { phone: '+1234567890' } };
    });

    const response = await app.inject({ method: 'GET', url: '/nested' });
    const body = JSON.parse(response.payload);

    expect(body.user.phone).toContain('****');
  });
});
