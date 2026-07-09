import { Maskify } from '../src/index';
import { GlobalConfigLoader } from '../src/utils/config';

/** Minimal stand-in for an Axiomify app: just enough to capture the onRequest hook. */
function createMockApp() {
  const hooks: Record<string, Array<(...args: any[]) => any>> = {};
  return {
    addHook(type: string, fn: (...args: any[]) => any) {
      (hooks[type] ||= []).push(fn);
    },
    async runOnRequest(req: any, res: any) {
      for (const fn of hooks.onRequest || []) {
        await fn(req, res);
      }
    },
  };
}

/** Minimal stand-in for Axiomify's synchronous NativeResponse.send(). */
function createMockRes() {
  return {
    sent: undefined as unknown,
    sentMessage: undefined as string | undefined,
    send(data: unknown, message?: string) {
      this.sent = data;
      this.sentMessage = message;
    },
  };
}

describe('Axiomify Middleware', () => {
  beforeAll(() => {
    jest.spyOn(GlobalConfigLoader, 'load').mockReturnValue({});
  });

  it('masks object payloads passed to res.send()', async () => {
    const app = createMockApp();
    Maskify.middlewares.axiomify(app, { fields: ['email'] });

    const res = createMockRes();
    await app.runOnRequest({}, res);

    res.send({ id: 1, email: 'test@example.com' }, 'OK');

    expect(res.sent).not.toEqual({ id: 1, email: 'test@example.com' });
    expect((res.sent as any).email).not.toBe('test@example.com');
    expect((res.sent as any).email).toContain('@');
    expect(res.sentMessage).toBe('OK');
  });

  it('passes non-object payloads through untouched', async () => {
    const app = createMockApp();
    Maskify.middlewares.axiomify(app, { fields: ['email'] });

    const res = createMockRes();
    await app.runOnRequest({}, res);

    res.send('plain string', 'OK');
    expect(res.sent).toBe('plain string');

    res.send(null, 'No Content');
    expect(res.sent).toBe(null);
  });

  it('never blocks the response if masking throws', async () => {
    const app = createMockApp();
    Maskify.middlewares.axiomify(app, { fields: ['email'] });

    const res = createMockRes();
    await app.runOnRequest({}, res);

    // A getter that throws during traversal/cloning forces applyMask() to
    // fail; send() must still deliver the original payload, not swallow it.
    const poisoned: any = {};
    Object.defineProperty(poisoned, 'email', {
      enumerable: true,
      get() {
        throw new Error('boom');
      },
    });

    expect(() => res.send(poisoned, 'OK')).not.toThrow();
    expect(res.sent).toBe(poisoned);
  });

  it('auto-masks without an explicit schema', async () => {
    const app = createMockApp();
    Maskify.middlewares.axiomify(app);

    const res = createMockRes();
    await app.runOnRequest({}, res);

    res.send({ password: 'super-secret', note: 'hello' });

    expect((res.sent as any).password).not.toBe('super-secret');
    expect((res.sent as any).note).toBe('hello');
  });
});
