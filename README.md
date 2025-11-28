Here is the updated `README.md`. It documents the new **Smart Compiler**, **Auto-Discovery**, **Fastify Support**, **Streaming**, and all other features added in v3.3.0.

````markdown:readme.md
# Maskify-TS

**Advanced data masking utility for Node.js & TypeScript** — intelligently mask emails, phones, credit cards, IPs, JWTs, and deeply nested object fields using a smart compiler.

[![npm version](https://img.shields.io/npm/v/maskify-ts.svg)](https://www.npmjs.com/package/maskify-ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/OTopman/maskify/actions/workflows/test.yml/badge.svg)](https://github.com/OTopman/maskify/actions)

It’s ideal for logging, analytics, and compliance scenarios (e.g., GDPR/PII redaction, HIPAA) where sensitive data must be obscured before storage or transmission.

## ⚡️ Features

- ✅ **Smart Compiler:** High-performance, single-pass lexer that identifies and masks PII patterns (Email, IP, JWT, etc.) within unstructured text logs.
- ✅ **Zero-Config Auto-Masking:** Heuristic analysis to automatically detect and mask sensitive data in objects without manual schema definition.
- ✅ **Deep Masking:** Mask strings, objects, arrays, and nested fields with zero mutation (non-destructive).
- ✅ **Class Decorators:** Declarative masking using `@Mask` on DTOs and Entities.
- ✅ **Stream Support:** High-performance masking for large files and logs (Transform Streams).
- ✅ **Advanced Modes:** Support for **Allowlist** (Mask everything *except* X) and **Blocklist**.
- ✅ **Deterministic Masking:** Generate consistent hashes for analytics (count unique users without storing PII).
- ✅ **Framework Ready:** Built-in middleware for **Express** and **Fastify**.
- ✅ **Specialized Maskers:** Auto-detects Email, Phone, Credit Card, IPv4/IPv6, JWT, URLs, Address, and Names.
- ✅ **CLI Tool:** Pipe logs directly from the command line.

---

## 📦 Installation

```bash
npm install maskify-ts
````

> **Note:** If you intend to use **Class Decorators**, you must install `reflect-metadata`:
>
> ```bash
> npm install reflect-metadata
> ```

-----

## 🚀 Quickstart

### 1\. Intelligent Masking (Smart Compiler)

Perfect for unstructured text like log messages or paragraphs.

```typescript
import { Maskify } from 'maskify-ts';

const log = "User admin@test.com failed login from IP 192.168.1.50 with token eyJhbGci...";

const safeLog = Maskify.smart(log); 
// Output: "User ad***@t***.com failed login from IP 192.168.1.*** with token eyJhbGci...********"
```

### 2\. Zero-Config Auto-Masking

Let Maskify figure out what to mask based on keys (`password`, `secret`) and values (Email, JWT, etc.).

```typescript
const dirtyData = {
  user: "John Doe",
  contact: "admin@company.com", // 🧠 Detected as Email
  meta: {
    ip: "10.0.0.5",             // 🧠 Detected as IP
    token: "eyJhbGciOi..."      // 🧠 Detected as JWT
  },
  secrets: {
    password: "super-secret-pw" // 🧠 Detected by Key Name
  }
};

const clean = Maskify.autoMask(dirtyData);
```

### 3\. Class Decorators (TypeScript)

Ideal for NestJS, TypeORM, or standardized DTOs.

```typescript
import { Mask, Maskify } from 'maskify-ts';

class UserDTO {
  @Mask({ type: 'email' })
  email: string;

  @Mask({ type: 'phone', maskChar: '#' })
  phone: string;

  // No decorator = No masking
  username: string;

  constructor(email: string, phone: string, username: string) {
    this.email = email;
    this.phone = phone;
    this.username = username;
  }
}

const user = new UserDTO('john@doe.com', '+1234567890', 'johndoe');
const masked = Maskify.maskClass(user);

console.log(masked);
// UserDTO { email: 'jo**@d**.com', phone: '+123#######90', username: 'johndoe' }
```

### 4\. Deterministic Masking (Analytics)

Generate consistent hashes to track usage without storing PII.

```typescript
const email = 'user@gmail.com';
const opts = { secret: 'my-app-super-secret' };

const hash1 = Maskify.deterministic(email, opts);
const hash2 = Maskify.deterministic(email, opts);

console.log(hash1 === hash2); // true (e.g., "a3f12b9...")
```

-----

## 🌊 Streaming (High Performance)

For processing large log files (GBs) without memory issues, use `MaskifyStream`.

```typescript
import { createReadStream, createWriteStream } from 'fs';
import { MaskifyStream } from 'maskify-ts/stream';

const read = createReadStream('production.log');
const write = createWriteStream('clean.log');

const maskStream = new MaskifyStream({
  'user.email': { type: 'email' },
  'context.ip': { type: 'ip' }
});

read.pipe(maskStream).pipe(write);
```

-----

## 🌐 Middleware Support

### Fastify

```typescript
import Fastify from 'fastify';
import { Maskify } from 'maskify-ts';

const app = Fastify();

// Automatically masks all outgoing responses
app.register(Maskify.middlewares.fastify, {
  maskOptions: { autoDetect: true }, // Enable smart detection
  fields: ['email', 'password', 'token']
});

app.get('/', async () => ({ email: 'test@test.com', password: '123' }));
// Response: { "email": "te**@t**.com", "password": "***" }
```

### Express

```typescript
import express from 'express';
import { Maskify } from 'maskify-ts';

const app = express();

// Register middleware
app.use(Maskify.middlewares.express({
  fields: [
    'email',
    { name: 'phone', options: { visibleEnd: 2 } }
  ]
}));
```

-----

## 💻 CLI Tool

Process logs directly from your terminal using the smart engine.

```bash
# Auto-detect PII in logs
cat app.log | npx maskify-ts --auto

# Strict Allowlist (Only keep timestamps)
cat app.log | npx maskify-ts --allow -f "timestamp"

# Load config from file
cat app.log | npx maskify-ts
```

**Configuration File (`maskify.config.js`):**

```javascript
module.exports = {
  mode: 'mask',
  fields: ['email', 'password'],
  maskOptions: { maskChar: '*' }
};
```

-----

## ⚙️ Configuration

### Maskable Types

The `type` option supports the following values:

  - `email`: Masks email addresses (e.g., `j***@d***.com`).
  - `phone`: Masks phone numbers, preserving international codes.
  - `card`: Masks credit card numbers, preserving last 4 digits.
  - `ip`: Masks IPv4 and IPv6 addresses.
  - `jwt`: Masks JWT payloads and signatures, preserving the header.
  - `url`: Masks sensitive query parameters in URLs.
  - `address`: Masks street numbers and secondary address lines.
  - `name`: Masks names (e.g., `J*** D***`).
  - `generic`: Standard masking (e.g., `s******`).

### MaskOptions Interface

```typescript
interface MaskOptions {
  type?: 'email' | 'phone' | 'card' | 'address' | 'name' | 'ip' | 'jwt' | 'url' | 'generic';
  visibleStart?: number; // Chars visible at start
  visibleEnd?: number;   // Chars visible at end
  maxAsterisks?: number; // Max length of mask string
  maskChar?: string;     // Default: '*'
  autoDetect?: boolean;  // Default: true
  pattern?: string;      // e.g. "###-**-###"
  transform?: (val: string) => string; // Custom function
}
```

-----

## Contributing

Contributions are welcome\! Please fork the repository and submit a pull request.

## License

MIT License

Copyright (c) 2025 Temitope Okunlola

```
```