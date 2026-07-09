# Migration Guide: v5 to v6

Maskify v6.0 introduces a modular, functional architecture built around high-performance **JIT-compiled schemas** and **chainable monadic builders** under the `m` namespace.

---

## What's New in v6.0

1. **JIT Compiled Schemas (`m.object`)**: Object schemas are compiled dynamically into flat Javascript code via `new Function()`. This avoids runtime path-traversal overhead and runs **4x - 10x faster** than legacy reflection-based masking.
2. **Chainable Monadic Builders**: Individual maskers under the `m` namespace (like `m.email()`, `m.phone()`) support monadic chaining:
   - `.when(condition)` (conditional masking)
   - `.redact(label?)` (direct redaction)
   - `.transform(fn)` (post-mask custom transformations)
3. **Automatic Nested Array Handling**: Property schemas compiled via `m.object` now automatically detect nested arrays and map the element schema across all items transparently.
4. **Asynchronous Middleware & CLI Compatibility**: All built-in framework middlewares (Express, Fastify, Prisma, Mongoose) and the CLI now support asynchronous execution paths out of the box, allowing you to use WebCrypto or custom async handlers in your masking pipeline.
5. **Axiomify Middleware**: Added `Maskify.middlewares.axiomify(app, options)` for the [Axiomify](https://github.com/OTopman/axiomify) framework. Unlike the other adapters, this one is **synchronous only** — Axiomify's `res.send()` serializes and writes to the socket before returning, so async custom maskers aren't supported here; mask those fields in the route handler before calling `res.send()`.

---

## Upgrade Steps

### 1. Schema Definitions

#### Legacy (v5.x):
Legacy schemas used dot-paths and wildcard notations for object mapping:
```ts
import { Maskify } from 'maskify-ts';

const masked = Maskify.maskSensitiveFields(user, {
  'profile.email': { type: 'email' },
  'orders[*].card': { type: 'card' }
});
```

#### Modern (v6.0+):
Use the type-safe `m.object` schema builder. Complex object structures and arrays of objects are resolved natively:
```ts
import { m } from 'maskify-ts';

const userSchema = m.object({
  profile: {
    email: m.email()
  },
  orders: [
    {
      card: m.card()
    }
  ]
});

const masked = userSchema(user);
```

### 2. Custom Masking Chains

#### Legacy (v5.x):
Configuration fields like `condition`, `redact`, `label`, and `transform` had to be passed inside a flat options object, which was prone to type mismatches:
```ts
Maskify.mask(val, {
  type: 'email',
  condition: (v, ctx) => ctx.isAdmin !== true,
  redact: true,
  label: '[HIDDEN]'
});
```

#### Modern (v6.0+):
Chain these modifiers directly onto the masker:
```ts
m.email()
  .when((_v, ctx) => ctx.isAdmin !== true)
  .redact('[HIDDEN]');
```

### 3. Middleware Changes

All database and HTTP framework adapters now execute their masking pipelines **asynchronously**. If you use synchronous flows that depend on immediate execution without microtasks, ensure they support standard asynchronous callbacks:

- **Express**: The Express middleware intercepts `res.json` and performs masking inside a microtask, calling `next(err)` to forward serialization errors.
- **Fastify**: The `preSerialization` hook now awaits `maskSensitiveFieldsAsync` and `autoMaskAsync`.
- **Prisma**: Extensions `$allOperations`, `$queryRaw`, and `$queryRawUnsafe` now await `applyMaskAsync`.
- **Mongoose**: The mongoose plugin now registers a `.maskAsync()` schema method in addition to `.mask()`.

---

## TypeScript Type Inference

You can now extract output TS shapes directly from your schemas:
```ts
import { m } from 'maskify-ts';

const schema = m.object({
  email: m.email(),
  phone: m.phone()
});

type MaskedPayload = m.infer<typeof schema>;
// Resulting type: { email: string; phone: string; }
```
