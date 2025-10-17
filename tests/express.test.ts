import express, { Request, Response } from 'express';
import request from 'supertest';
import { Maskify } from '../src/index';

describe('Maskify Express Middleware', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Option 1
    /* const middleware = await Maskify.middlewares.express({
      fields: ['email', 'phone'],
    });

    app.use(middleware); */

    // Option 2
    Maskify.use(app, {
      fields: [
        { name: 'email', options: { type: 'email' } },
        { name: 'phone', options: { type: 'phone' } },
      ], // or ['email', 'phone', ],

      maskOptions: {
        autoDetect: true,
        maxAsterisks: 4,
      },
    });

    app.post('/user', (req: Request, res: Response) => {
      res.json(req.body);
    });
  });

  it('should mask sensitive fields in the response', async () => {
    const response = await request(app).post('/user').send({
      email: 'john.doe@example.com',
      phone: '+2348012345678',
      name: 'John Doe',
    });

    expect(response.status).toBe(200);
    expect(response.body.email).not.toBe('john.doe@example.com');
    expect(response.body.phone).not.toBe('+2348012345678');
    expect(response.body.name).toBe('John Doe');
  });

  it('should leave non-matching fields untouched', async () => {
    const response = await request(app)
      .post('/user')
      .send({ username: 'notmasked' });

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('notmasked');
  });

  it('should work with Maskify.use()', async () => {
    const anotherApp = express();
    anotherApp.use(express.json());

    await Maskify.use(anotherApp, { fields: ['email', 'phone'] });

    anotherApp.post('/mask', (req: Request, res: Response) => {
      res.json(req.body);
    });

    const response = await request(anotherApp)
      .post('/mask')
      .send({ email: 'sample@example.com', phone: '+2348012345678' });

    expect(response.body.email).not.toBe('sample@example.com');
    expect(response.body.phone).not.toBe('+2348012345678');
  });
});
