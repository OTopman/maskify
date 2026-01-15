# Maskify

**Advanced data masking utility for Node.js & TypeScript** — intelligently mask emails, phones, credit cards, IPs, JWTs, and deeply nested object fields using a smart compiler.

[![npm version](https://img.shields.io/npm/v/maskify-ts.svg)](https://www.npmjs.com/package/maskify-ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/OTopman/maskify/actions/workflows/test.yml/badge.svg)](https://github.com/OTopman/maskify/actions)

It’s ideal for logging, analytics, and compliance scenarios (e.g., GDPR/PII redaction, HIPAA) where sensitive data must be obscured before storage or transmission.

> 🔒 **Production-Ready Data Masking** for GDPR, HIPAA, and PCI-DSS Compliance

It's ideal for logging, analytics, and compliance scenarios (e.g., GDPR/PII redaction, HIPAA) where sensitive data must be obscured before storage or transmission.

---

## 📊 Why Maskify?

| Feature | Maskify | Alternatives |
|---------|---------|--------------|
| Smart Pattern Detection | ✅ Auto-detects PII | ❌ Manual config |
| TypeScript Support | ✅ Full | ⚠️ Partial |
| Zero Dependencies* | ✅ Minimal | ⚠️ Heavy |
| Streaming Support | ✅ Yes | ❌ No |
| Framework Integration | ✅ Express/Fastify | ❌ Limited |
| Performance | ✅ Single-pass lexer | ⚠️ Multi-regex |
| CLI Tool | ✅ Yes | ⚠️ Limited |

*Reflects-metadata only needed for decorators

---


## ☕ Support the Project

If Maskify helps you, consider supporting the development:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/maskify)
<!-- [![Sponsor](https://img.shields.io/badge/GitHub%20Sponsor-ea4aaa?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/OTopman) -->

---

## ⚡️ Features

- ✅ **Smart Compiler:** High-performance, single-pass lexer that identifies and masks PII patterns (Email, IP, JWT, etc.) within unstructured text logs.
- ✅ **Configuration Files:** Support for `maskify.config.js` and `.maskifyrc` with `defineConfig` support.
- ✅ **Zero-Config Auto-Masking:** Heuristic analysis to automatically detect and mask sensitive data in objects without manual schema definition.
- ✅ **Deep Masking:** Mask strings, objects, arrays, and nested fields with zero mutation (non-destructive).
- ✅ **Database Integrations:** Native support for **Prisma**, **TypeORM**, and **Mongoose** to mask data at the database layer.
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

### 3. Configuration File (New!) 🆕

Define your masking rules once in `maskify.config.js` and reuse them across your App, CLI, and Middlewares.

```javascript
// maskify.config.js
const { defineConfig } = require('maskify-ts');

module.exports = defineConfig({
  mode: 'mask', // or 'allow'
  fields: ['email', 'password', 'token'],
  maskOptions: {
    maskChar: '*',
    autoDetect: true
  }
});
```

### 4. Class Decorators (TypeScript)

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

### 5. Deterministic Masking (Analytics)

Generate consistent hashes to track usage without storing PII.

```typescript
const email = 'user@gmail.com';
const opts = { secret: 'my-app-super-secret' };

const hash1 = Maskify.deterministic(email, opts);
const hash2 = Maskify.deterministic(email, opts);

console.log(hash1 === hash2); // true (e.g., "a3f12b9...")
```

### 6. 🗄️ Database Integrations

Automatically mask data at the database layer before it reaches your application logic.

#### Prisma

```typescript
import { PrismaClient } from '@prisma/client';
import { Maskify } from 'maskify-ts';

const prisma = new PrismaClient().$extends(
  Maskify.middlewares.prisma({
    fields: ['password', 'user.email'],
    maskOptions: { maskChar: '*' }
  })
);
```

#### TypeORM
```typescript
import { DataSource } from 'typeorm';
import { Maskify } from 'maskify-ts';

const dataSource = new DataSource({
  // ... config
  subscribers: [
    // Automatically masks entities loaded with @Mask decorators
    Maskify.middlewares.typeorm()
  ]
});
```

#### Mongoose
```typescript
import mongoose from 'mongoose';
import { Maskify } from 'maskify-ts';

const userSchema = new mongoose.Schema({ ... });

userSchema.plugin(Maskify.middlewares.mongoose, {
  fields: ['ssn', 'credit_card'],
  autoMaskJSON: true // Automatically masks when res.json() is called
});
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

## 🧠 Deep Dive: Advanced Concepts
### Smart Compiler (The Lexer)
For unstructured text, Maskify uses a Lexer (Tokenizer) architecture instead of running multiple regex replacements.

1. **Tokenization:** The input is scanned in a single pass using a Master Regex.
2. **Transformation:** Tokens identified as PII (JWT, IP, Email) are masked; text is left alone
3. **Reassembly:** The safe string is reconstructed.

### Zero-Config Heuristics
The ```autoMask()``` function uses two strategies to secure your data without a schema:

1. **Key Matching:** Checks property names against a list of sensitive keywords (e.g., password, token, secret, cvv, ssn).
2. **Value Analysis:** If the key is safe, it scans the value content to detect PII patterns like Emails, JWTs, Credit Cards, or IPs.

### Allowlist Mode (Zero-Trust)
In strict security environments, you may want to hide everything by default and only reveal specific fields.
```typescript
const sensitiveData = {
  id: 123,
  timestamp: 1600000000,
  user: { name: 'John', ssn: '000-00-0000' }
};

// Only 'id' and 'timestamp' survive. Everything else is redacted.
const safe = Maskify.maskSensitiveFields(sensitiveData, {
  'id': {},
  'timestamp': {}
}, { mode: 'allow' });
```

---

## 🚨 Security

For security vulnerabilities, see [SECURITY.md](SECURITY.md).

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING. md) for guidelines.

---

## 📄 License

MIT License — See [LICENSE](LICENSE) file for details. 

Copyright (c) 2025 Temitope Okunlola

---

## 🙏 Support

- 📖 [Full Documentation](https://github.com/OTopman/maskify)
- 💬 [GitHub Discussions](https://github.com/OTopman/maskify/discussions)
- 🐛 [Report Issues](https://github.com/OTopman/maskify/issues)
- ⭐ **Like Maskify? Please give us a star!**