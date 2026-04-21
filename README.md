# maskify-ts

Production-grade data masking for Node.js and TypeScript. GDPR / HIPAA / PCI-DSS friendly, zero runtime dependencies beyond `reflect-metadata`, designed for high-throughput logging, API responses, and analytics pipelines.

- Pre-compiled PII detectors (email, phone, card with Luhn, IP, JWT, URL, address, name)
- Schema-driven field masking with dot-paths and array wildcards (`users[*].email`)
- Deterministic HMAC hashing for analytics-safe pseudonymization
- First-class adapters for **Express**, **Fastify**, **Prisma**, **TypeORM**, **Mongoose**
- `@Mask` decorators, `Transform` streams, and a `maskify` CLI for ad-hoc log sanitization
- Dual ESM / CJS output, typed exports, `sideEffects: false`

---

## Table of contents

- [maskify-ts](#maskify-ts)
  - [Table of contents](#table-of-contents)
  - [Install](#install)
  - [Quick start](#quick-start)
  - [Core API](#core-api)
    - [`Maskify.mask(value, options?)`](#maskifymaskvalue-options)
    - [`Maskify.pattern(value, pattern, options?)`](#maskifypatternvalue-pattern-options)
    - [`Maskify.smart(freeText)`](#maskifysmartfreetext)
    - [`Maskify.autoMask(data, options?)`](#maskifyautomaskdata-options)
    - [`Maskify.maskSensitiveFields(data, schema, options?)`](#maskifymasksensitivefieldsdata-schema-options)
    - [`Maskify.deterministic(value, options)`](#maskifydeterministicvalue-options)
    - [`Maskify.maskClass(instance)`](#maskifymaskclassinstance)
  - [Supported types](#supported-types)
  - [Masking options](#masking-options)
  - [Configuration file](#configuration-file)
  - [Framework middlewares](#framework-middlewares)
    - [Express](#express)
    - [Fastify](#fastify)
    - [Prisma](#prisma)
    - [TypeORM](#typeorm)
    - [Mongoose](#mongoose)
  - [Decorators](#decorators)
  - [Streams](#streams)
  - [CLI](#cli)
  - [Custom maskers](#custom-maskers)
  - [Error handling](#error-handling)
  - [TypeScript](#typescript)
  - [Performance](#performance)
  - [Compatibility](#compatibility)
  - [Further reading](#further-reading)
  - [License](#license)

---

## Install

```bash
npm install maskify-ts
# or
pnpm add maskify-ts
# or
yarn add maskify-ts
```

Framework adapters rely on optional peer dependencies — install only what you use:

```bash
# Express
npm install express
# Fastify
npm install fastify fastify-plugin
# Prisma / TypeORM / Mongoose: use the libraries you already have
```

Requires Node.js **>= 18**.

---

## Quick start

```ts
import { Maskify } from 'maskify-ts';

// Single value — detects the PII type automatically
Maskify.mask('jane.doe@company.com');        // → 'j*******e@c******y.com'
Maskify.mask('4111 1111 1111 1111');         // → '**** **** **** 1111'
Maskify.mask('+1 (415) 555-0123');           // → '+**********0123'

// Force a specific masker
Maskify.mask('eyJhbGciOi...xyz', { type: 'jwt' });

// Free-text (logs, chat messages)
Maskify.smart('User jane@company.com logged in from 10.0.0.12');
// → 'User j**@c*******y.com logged in from **.*.*.**'

// Deep object masking with a schema
Maskify.maskSensitiveFields(
  { user: { email: 'jane@company.com', cards: [{ number: '4111111111111111' }] } },
  {
    'user.email': { type: 'email' },
    'user.cards[*].number': { type: 'card' },
  },
);
```

---

## Core API

All methods are pure — they return a **new** value and never mutate the input.

### `Maskify.mask(value, options?)`

Masks a single string. If `options.type` is omitted and `autoDetect` is enabled (default), the type is inferred via the detector chain.

```ts
Maskify.mask('secret-token', { maskChar: '•', visibleStart: 2, visibleEnd: 2 });
// → 'se•••••••en'

// Pattern overrides type/auto-detection
Maskify.mask('4111111111111111', { pattern: '####-####-####-####' });
// → '4111-****-****-****'

// Custom transform (takes precedence over everything)
Maskify.mask('jane@example.com', { transform: v => `[redacted:${v.length}]` });
```

### `Maskify.pattern(value, pattern, options?)`

Explicit pattern masking. `#` reveals the original char, everything else is the mask char (default `*`). Supports `{n}` repetition.

```ts
Maskify.pattern('4111111111111111', '####-****-****-####');
// → '4111-****-****-1111'

Maskify.pattern('abc123', '##*{4}');
// → 'ab****'
```

### `Maskify.smart(freeText)`

Tokenizes a free-text string, detects PII inside each token, and masks in place. Ideal for log sanitization where you don't know the structure.

```ts
Maskify.smart('Charged card 4111-1111-1111-1111 from 10.0.0.1 at https://api.com?token=abc');
```

### `Maskify.autoMask(data, options?)`

Walks an object/array and masks values that match sensitive key names (`password`, `token`, `ssn`, …) or look like PII (emails, IPs, JWTs).

```ts
Maskify.autoMask({
  id: 42,
  email: 'jane@company.com',
  password: 's3cret',
  meta: { ip: '10.0.0.1' },
});
// → { id: 42, email: 'j***@c******.com', password: '******', meta: { ip: '**.*.*.*' } }

// Narrow the scope
Maskify.autoMask(data, {
  sensitiveKeys: ['password', 'apiKey'],
  autoDetectTypes: ['email', 'jwt'],
});
```

### `Maskify.maskSensitiveFields(data, schema, options?)`

Schema-driven masking with two modes:

| Mode     | Behavior                                                                  |
| -------- | ------------------------------------------------------------------------- |
| `mask`   | (default) Mask only the fields listed in the schema; everything else raw. |
| `allow`  | Mask **everything except** the fields listed in the schema.               |

Paths support dot notation, array wildcards, and numeric indices:

```ts
Maskify.maskSensitiveFields(
  {
    user: { email: 'jane@co.com', phone: '+14155550123' },
    orders: [{ card: { number: '4111111111111111' } }],
  },
  {
    'user.email': { type: 'email' },
    'user.phone': { type: 'phone' },
    'orders[*].card.number': { type: 'card' },
  },
);

// Allowlist: nothing escapes except the schema keys
Maskify.maskSensitiveFields(payload, { 'user.id': { type: 'generic' } }, { mode: 'allow' });
```

### `Maskify.deterministic(value, options)`

HMAC-based one-way hashing. Same input + same secret always produces the same short hash — useful for analytics or join keys without storing PII.

```ts
import { Maskify } from 'maskify-ts';

const pseudoId = Maskify.deterministic('jane@company.com', {
  secret: process.env.MASKIFY_SECRET!,   // REQUIRED, must be >= 16 chars
  algorithm: 'sha256',                   // 'sha256' (default) | 'sha512'
  length: 16,                            // hex chars to keep
});
// → 'a3f12b9c8e7d4f21'
```

Throws `MaskifyConfigError` when the secret is missing or too short. **Never commit the secret** — store it in an environment variable or a secrets manager.

### `Maskify.maskClass(instance)`

Returns a shallow clone with every `@Mask`-decorated property replaced. Walks the prototype chain, so decorators on base classes are honoured.

```ts
import 'reflect-metadata';
import { Maskify, Mask } from 'maskify-ts';

class User {
  id = 1;
  @Mask({ type: 'email' }) email = 'jane@company.com';
  @Mask({ type: 'phone' }) phone = '+14155550123';
}

Maskify.maskClass(new User());
// → User { id: 1, email: 'j***@c******.com', phone: '+**********23' }
```

---

## Supported types

`MaskableType = 'email' | 'phone' | 'card' | 'address' | 'name' | 'generic' | 'ip' | 'jwt' | 'url'`

Detection order (most specific → least): `jwt → email → ip → card (Luhn) → phone → url → address → name → generic`.

Card detection runs the **Luhn mod-10** checksum to avoid masking plausible-looking but non-card numbers.

---

## Masking options

```ts
interface MaskOptions {
  type?: MaskableType;                   // force a specific masker
  autoDetect?: boolean;                  // default: true
  maskChar?: string;                     // default: '*'
  visibleStart?: number;                 // chars revealed at start
  visibleEnd?: number;                   // chars revealed at end
  maxAsterisks?: number;                 // cap mask length
  pattern?: string;                      // '####-****-####' style
  transform?: (value: string) => string; // custom function (highest precedence)
  strict?: boolean;                      // throw on invalid input
  maxLength?: number;                    // input length ceiling
  allowEmpty?: boolean;
  secret?: string;                       // used by deterministic mode
}

interface AutoMaskOptions extends MaskOptions {
  sensitiveKeys?: string[];              // extra key names to always mask
  autoDetectTypes?: MaskableType[];      // restrict which types trigger detection
}
```

Precedence: `transform` > `pattern` > `type` > `autoDetect`.

---

## Configuration file

Drop a config file at the project root and every `Maskify.*` call — including middlewares and the CLI — will pick it up automatically.

Supported filenames (first match wins):

`maskify.config.js` · `maskify.config.cjs` · `maskify.config.ts` · `.maskifyrc.js` · `.maskifyrc.json` · `.maskifyrc` · `"maskify"` field in `package.json`.

```ts
// maskify.config.ts
import { defineConfig } from 'maskify-ts';

export default defineConfig({
  mode: 'mask',
  fields: [
    'email',
    'password',
    { name: 'creditCard', options: { type: 'card' } },
  ],
  maskOptions: {
    maskChar: '•',
    visibleEnd: 4,
  },
});
```

Invalid keys are silently ignored so a typo can't crash the app at startup. Pass `{ strict: true }` to `GlobalConfigLoader.load` if you want loud failures instead.

```ts
import { GlobalConfigLoader } from 'maskify-ts';

GlobalConfigLoader.load({ strict: true });  // throws MaskifyConfigError on bad syntax
GlobalConfigLoader.reload();                // clears the cache
```

---

## Framework middlewares

All adapters accept the same shape:

```ts
interface MiddlewareOptions {
  fields?: (string | { name: string; options?: MaskOptions })[];
  maskOptions?: AutoMaskOptions;
}
```

If `fields` is omitted, the adapter falls back to `Maskify.autoMask` over the response body.

### Express

```ts
import express from 'express';
import { Maskify } from 'maskify-ts';

const app = express();

app.use(Maskify.middlewares.express({
  fields: [
    { name: 'email', options: { type: 'email' } },
    { name: 'password' },
  ],
}));

// …or the convenience wrapper
Maskify.use(app, { fields: ['email', 'password'] });
```

Wraps `res.json` so any JSON response body is masked before being sent to the client.

### Fastify

```ts
import Fastify from 'fastify';
import { Maskify } from 'maskify-ts';

const app = Fastify();

await app.register(Maskify.middlewares.fastify, {
  fields: ['email', 'phone'],
});

// …or
Maskify.use(app, { fields: ['email', 'phone'] }, 'fastify');
```

Uses an `onSend` hook, handles both object and string/buffer payloads, and never blocks the response if masking fails.

### Prisma

```ts
import { PrismaClient } from '@prisma/client';
import { Maskify } from 'maskify-ts';

const prisma = new PrismaClient().$extends(
  Maskify.middlewares.prisma({
    fields: [{ name: 'email', options: { type: 'email' } }],
  }),
);

await prisma.user.findMany(); // email is masked
await prisma.user.create({ data: { email } }); // write ops are NEVER masked
```

Only transforms **read** operations (`findUnique`, `findFirst`, `findMany`, `aggregate`, `groupBy`, `queryRaw`, and their `*OrThrow` siblings). Writes always go through untouched.

### TypeORM

```ts
import { DataSource } from 'typeorm';
import { Maskify } from 'maskify-ts';

const subscriber = Maskify.middlewares.typeorm({
  fields: [{ name: 'email', options: { type: 'email' } }],
});

const ds = new DataSource({
  // …connection opts…
  subscribers: [subscriber],
});
```

The subscriber installs a non-enumerable `toJSON` on every loaded entity, so `JSON.stringify(entity)` / `res.json(entity)` produce masked output **while the in-memory entity stays unmodified**. This avoids the classic pitfall of TypeORM's UnitOfWork persisting masked values on the next `save()`.

### Mongoose

```ts
import { Schema, model } from 'mongoose';
import { Maskify } from 'maskify-ts';

const UserSchema = new Schema({ email: String, phone: String });

UserSchema.plugin(Maskify.middlewares.mongoose, {
  fields: ['email', 'phone'],
});

const User = model('User', UserSchema);

const doc = await User.findById(id);
doc.toJSON();   // masked
doc.mask();     // explicit helper — same result
```

---

## Decorators

```ts
import 'reflect-metadata';
import { Mask, Maskify } from 'maskify-ts';

class Account {
  id!: number;

  @Mask({ type: 'email' })
  email!: string;

  @Mask({ maskChar: '•', visibleEnd: 4 })
  ssn!: string;
}

const masked = Maskify.maskClass(account);
```

Requires `reflect-metadata` (installed as a dependency) and `"experimentalDecorators": true` + `"emitDecoratorMetadata": true` in your `tsconfig.json`.

---

## Streams

```ts
import { createReadStream } from 'node:fs';
import { createMaskStream } from 'maskify-ts/stream';

createReadStream('app.log', { encoding: 'utf8' })
  .pipe(createMaskStream(
    { 'user.email': { type: 'email' } },      // schema (optional)
    { mode: 'mask', maskChar: '•' },          // stream options
  ))
  .pipe(process.stdout);
```

Accepts both object-mode and buffer/string chunks. JSON lines are parsed and re-serialized; non-JSON text falls back to `Maskify.smart` so nothing leaks through unmasked. A malformed chunk is passed through unchanged — the pipeline never drops data.

---

## CLI

```bash
# Pipe JSON log lines through masking
cat app.log | npx maskify

# Pick specific fields
cat app.log | npx maskify --fields email,phone,password

# Custom mask character
npx maskify -f email -c '•' < app.log

# Allowlist mode — mask everything except listed fields
npx maskify --allow --fields id,createdAt < app.log

# Help
npx maskify --help
```

The CLI respects your `maskify.config.*` file. Non-JSON lines are passed through untouched.

---

## Custom maskers

Register process-wide or build an isolated registry for tests and multi-tenant contexts.

```ts
import { MaskerRegistry, Maskify } from 'maskify-ts';

// Process-wide
import { registry } from 'maskify-ts';
registry.register('iban', (value) =>
  value.slice(0, 4) + '*'.repeat(Math.max(0, value.length - 8)) + value.slice(-4),
);

Maskify.mask('GB82WEST12345698765432', { type: 'iban' });

// Isolated (testing / request-scoped)
const local = MaskerRegistry.create();
local.register('ssn', (v) => '***-**-' + v.slice(-4));
local.types();   // ['ssn']
local.has('ssn'); // true
```

---

## Error handling

```ts
import {
  MaskifyError,
  MaskifyValidationError,
  MaskifyConfigError,
} from 'maskify-ts';

try {
  Maskify.deterministic(email, { secret: '' });
} catch (err) {
  if (err instanceof MaskifyConfigError) {
    console.error(err.message, '\nHint:', err.hint);
  }
}
```

- `MaskifyError` — base class, carries optional `context`
- `MaskifyValidationError` — input failed validation (length, type, …)
- `MaskifyConfigError` — misconfiguration (missing secret, invalid config file); has a `hint` field

Opt into strict mode on any call with `{ strict: true }` to promote silent fallbacks into thrown errors.

---

## TypeScript

All public types are re-exported from the main entry:

```ts
import type {
  MaskOptions,
  AutoMaskOptions,
  MaskableType,
  MaskSchemaOptions,
  MiddlewareOptions,
  MaskStreamOptions,
} from 'maskify-ts';
```

Dual-output package: ESM (`dist/esm`), CJS (`dist/cjs`), `.d.ts` (`dist/types`). `sideEffects: false` enables tree-shaking of unused maskers and adapters.

---

## Performance

- Regex patterns compiled **once** at module load and frozen.
- Detector short-circuits on the first match; order is tuned so the common case (email) wins early.
- `safeClone` uses `structuredClone` when available, falls back to a hand-rolled clone with circular-reference tracking via `WeakMap`.
- Word-boundary + camelCase-aware key matching avoids masking `author` because it contains `auth`.

Benchmarks live under [`tests/benchmarks`](./tests/benchmarks) and run with [mitata](https://github.com/evanwashere/mitata):

```bash
npm run bench
```

---

## Compatibility

| Runtime         | Supported |
| --------------- | --------- |
| Node.js ≥ 18    | ✅        |
| Bun             | ✅        |
| Deno (via npm:) | ✅        |
| Browsers        | 🚫 (Node crypto required) |

Peer dependencies are all optional — install only the frameworks you actually use.

---

## Further reading

- **Runnable examples** in [`examples/`](./examples) — basic masking, `autoMask`, `smart`, decorators, streams, and every framework adapter (Express, Fastify, Prisma, TypeORM, Mongoose).
- **Guides** in [`docs/`](./docs):
  - [Security best practices](./docs/security-best-practices.md)
  - [Performance tuning](./docs/performance-tuning.md)
- [Migration guide](./MIGRATION.md)
- [Security policy](./SECURITY.md)
- [Contributing guide](./CONTRIBUTING.md)
- [Changelog](./CHANGELOG.md)

---

## License

MIT © [Temitope Okunlola](https://github.com/OTopman)
