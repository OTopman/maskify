import { Maskify } from '../src/index';
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Readable } from 'stream';

describe('Primitive Array Masking and Robustness Fixes', () => {
  describe('Bug 1 & 2: Primitive Array Masking', () => {
    it('should mask array of primitives in blocklist mode using wildcards', () => {
      const data = {
        users: ['jane@company.com', 'john@company.com']
      };

      const result = Maskify.maskSensitiveFields(
        data,
        {
          'users[*]': { type: 'email' }
        }
      ) as typeof data;

      expect(result.users[0]).not.toBe('jane@company.com');
      expect(result.users[0]).toMatch(/^[a-zA-Z]\*+@[a-zA-Z]\*+\.[a-zA-Z]+$/);
      expect(result.users[1]).not.toBe('john@company.com');
      expect(result.users[1]).toMatch(/^[a-zA-Z]\*+@[a-zA-Z]\*+\.[a-zA-Z]+$/);
    });

    it('should mask array of primitives in blocklist mode using index paths', () => {
      const data = {
        users: ['jane@company.com', 'john@company.com']
      };

      const result = Maskify.maskSensitiveFields(
        data,
        {
          'users[0]': { type: 'email' }
        }
      ) as typeof data;

      expect(result.users[0]).not.toBe('jane@company.com');
      expect(result.users[1]).toBe('john@company.com'); // indices not specified shouldn't be masked
    });

    it('should mask array of primitives in allowlist mode when not in schema', () => {
      const data = {
        id: 101,
        users: ['jane@company.com', 'john@company.com']
      };

      const result = Maskify.maskSensitiveFields(
        data,
        {
          id: {}
        },
        { mode: 'allow' }
      ) as typeof data;

      expect(result.id).toBe(101);
      expect(result.users[0]).not.toBe('jane@company.com');
      expect(result.users[1]).not.toBe('john@company.com');
    });

    it('should allow array of primitives in allowlist mode if in schema', () => {
      const data = {
        id: 101,
        users: ['jane@company.com', 'john@company.com']
      };

      const result = Maskify.maskSensitiveFields(
        data,
        {
          id: {},
          'users[*]': {}
        },
        { mode: 'allow' }
      ) as typeof data;

      expect(result.id).toBe(101);
      expect(result.users[0]).toBe('jane@company.com');
      expect(result.users[1]).toBe('john@company.com');
    });
  });

  describe('Bug 3: Deterministic Masker options checks', () => {
    it('should throw MaskifyConfigError when options are omitted', () => {
      expect(() => {
        (Maskify as any).deterministic('user@example.com');
      }).toThrow();
    });

    it('should hash correctly when correct options are provided', () => {
      const result = Maskify.deterministic('user@example.com', { secret: 'my-secret-key-1234' });
      expect(result).toHaveLength(12);
      expect(result).not.toBe('user@example.com');
    });
  });

  describe('Bug 4: Fastify middleware streams and content types', () => {
    let app: FastifyInstance;

    beforeEach(() => {
      app = Fastify();
      Maskify.use(
        app,
        {
          fields: ['email'],
          maskOptions: { maskChar: '*' },
        },
        'fastify'
      );
    });

    afterEach(async () => {
      await app.close();
    });

    it('should bypass masking for stream responses', async () => {
      app.get('/stream', async (_request: FastifyRequest, reply: FastifyReply) => {
        reply.header('content-type', 'application/octet-stream');
        const stream = new Readable();
        stream.push('raw stream data containing email@example.com');
        stream.push(null);
        return stream;
      });

      const response = await app.inject({
        method: 'GET',
        url: '/stream',
      });

      expect(response.payload).toBe('raw stream data containing email@example.com');
    });

    it('should bypass masking for non-JSON content-types (e.g. text/plain)', async () => {
      app.get('/text', async (_request: FastifyRequest, reply: FastifyReply) => {
        reply.header('content-type', 'text/plain');
        return 'plain text content email@example.com';
      });

      const response = await app.inject({
        method: 'GET',
        url: '/text',
      });

      expect(response.payload).toBe('plain text content email@example.com');
    });

    it('should mask JSON response with content-type set to application/json', async () => {
      app.get('/json', async () => {
        return { email: 'jane@company.com' };
      });

      const response = await app.inject({
        method: 'GET',
        url: '/json',
      });

      const body = JSON.parse(response.payload);
      expect(body.email).not.toBe('jane@company.com');
      expect(body.email).toContain('*');
    });
  });
});
