
---

# Changelog

All notable changes to this project will be documented in this file.


## v4.0.0 - 2026-05-28
### 🚀 New Features
- **TC39 Stage 3 Decorator Support**: Upgraded the `@Mask` decorator from legacy experimental syntax to the standard TC39 Stage 3 decorator syntax. Cleaned up `reflect-metadata` dependency entirely, making Maskify **zero-dependency** by default.
- **Browser & Edge Support**: Made the entire codebase browser-compatible. Replaced the `node:crypto` dependency with Web Crypto API (`globalThis.crypto.subtle`) for deterministic masking.
- **Async Masking Pipeline**: Added a full asynchronous pipeline for high-performance and flexible masking:
  - `Maskify.maskAsync()`
  - `Maskify.maskSensitiveFieldsAsync()`
  - `Maskify.autoMaskAsync()`
  - `Maskify.maskClassAsync()`
  - `Maskify.deterministicAsync()`
- **Zod Integration**: Added native support for Zod schemas via a dedicated subpath import `maskify-ts/zod`. Includes:
  - `zodMask(schema, maskSchema)`: Object-level schema preprocessor.
  - `zodMaskField(options)`: Field-level pre-transformed string field schema.
- **Context-Aware / Conditional Masking**: Added `condition` predicates and a runtime `context` parameter to `MaskOptions` and schema options, enabling dynamic bypass of masking operations (e.g. based on user role or permission level).
- **Full Redaction & Classification Modes**: Added `redact` and `label` settings to replace character-by-character asterisk obfuscation with full value redaction and classification labels (e.g. `[REDACTED_EMAIL]`, `[REDACTED_PHONE]`, or custom text overrides like `[CONFIDENTIAL]`).
- **GraphQL Schema Directive Integration**: Created `graphqlMask` schema transformer (exported via subpath `maskify-ts/graphql`) to automatically wrap and resolve resolvers for fields annotated with `@mask` directives, passing along the resolver request context to conditional masking rules.
- **Unified Benchmarks & CI Performance Verification**: Integrated mitata benchmarks directly into the CI pipeline to prevent performance regressions.
- **Full Compile-Time Type-Safe Schema Validation**: Enforced compile-time dot-notation verification (`Paths<T>`) for masking schemas across `maskSensitiveFields`, `maskSensitiveFieldsAsync`, streams, Zod schemas, and all server/database middlewares (Express, Fastify, Prisma, Mongoose, TypeORM).

### ⚠️ Breaking Changes
- The `@Mask` decorator now requires TypeScript 5.0+ and Stage 3 decorator support. The `reflect-metadata` library is no longer loaded or required.
- `Maskify.deterministic()` will throw a `MaskifyConfigError` if run synchronously in a browser or edge environment. Use the asynchronous `Maskify.deterministicAsync()` instead.

## v3.5.0 - 2026-01-15
### 🚀 New Features
- **Configuration Autoloading**: Maskify now automatically searches for and loads configuration from `maskify.config.js`, `.maskifyrc`, or `package.json` if no options are passed to middlewares or CLI.
- **Type-Safe Config**: Added `defineConfig` helper to provide IntelliSense and type safety for `maskify.config.js` files.
- **Zero-Config Middleware**: All middlewares (Express, Fastify, Prisma, TypeORM, Mongoose) can now be initialized without arguments, automatically picking up the global configuration.
- **Enhanced CLI**: The CLI tool now supports object-based field definitions (via config file) and automatically loads your project's configuration.

### 🛠 Improvements
- **Refactored CLI**: Updated CLI argument parsing to handle complex field schemas defined in configuration files.

## v3.4.0 - 2025-12-13
### 🚀 New Features
- **Database Integrations**: Added native middleware and plugins for major ORMs to mask data at the database layer:
    - **Prisma**: Added `$extends` extension for masking read operations (`findUnique`, `findMany`).
    - **TypeORM**: Added `Subscriber` to automatically mask entities loaded with `@Mask` decorators.
    - **Mongoose**: Added schema plugin with `.mask()` helper and optional `toJSON` automation.

## v3.3.2 - 2025-12-05
### 📚 Documentation
- Rewrote `README.md` to include comprehensive guides for Smart Compiler, Zero-Config Auto-Masking, Middleware, and Advanced Strategies.

### ⚡️ Performance & Refactors
- **Caching Strategy**: Implemented `LimitedCache` (LRU-like) for Regex compilation and Path parsing to prevent memory leaks in high-throughput environments.
- **Optimized Cloning**: Updated `safeClone` to prioritize `structuredClone` for native performance gains.
- **Config Loader**: Consolidated configuration logic into `src/utils/config.ts` and removed redundant loaders.

### 🧪 Tests
- **Test Isolation**: Fixed flaky tests by isolating global configuration using `jest.spyOn`.
- **Mocking**: Improved file system mocking for reliable config loader testing.
---

## v3.3.0 - 2025-11-28
### 🚀 Enhancements
- **Smart Compiler (Lexer/Tokenizer)**: Introduced a high-performance, single-pass compiler that smartly detects and masks sensitive patterns (Email, IP, JWT, Card, Phone, URL) within unstructured text logs without manual configuration.
- **Zero-Config Auto-Masking**: Added `Maskify.autoMask()` which uses heuristic analysis to automatically detect and mask PII in objects by scanning keys and values.
- **Fastify Support**: Added a built-in Fastify middleware plugin for seamless integration.
- **Class Decorators**: Introduced the `@Mask()` decorator for declarative masking on class properties (DTOs, Entities).
- **Deterministic Masking**: Added `Maskify.deterministic()` to generate consistent hashes for analytics purposes.
- **Stream Support**: Implemented `MaskifyStream` for high-performance masking of large files and logs via Node.js Transform streams.
- **New Maskers**:
    - **IP Address**: Added support for masking IPv4 and IPv6 addresses.
    - **JWT**: Added support for masking JWTs (preserving the header while masking payload and signature).
    - **URL**: Added support for masking sensitive query parameters in URLs.
    - **Address & Name**: Added basic detection and masking strategies for addresses and names.
- **Allowlist Mode**: Introduced `mode: 'allow'` option to mask everything *except* specified fields.
- **CLI Tool**: Added a command-line interface (`maskify-ts`) for piping logs and masking data directly from the terminal with support for config files (`maskify.config.js`).

### 🛠 Refactors & Fixes
- **Deep Cloning**: Switched to `structuredClone` (with fallback) and implemented `WeakMap` based circular reference handling to prevent stack overflow errors and ensure true deep cloning without mutation.
- **Middleware Optimization**: Optimized Express middleware to pre-calculate schemas during initialization rather than on every request, significantly improving performance.
- **Type Definitions**: Removed manual `.d.ts` file maintenance in favor of automated type generation from source, fixing missing export issues like `maskClass`.
- **Prototype Preservation**: Fixed `maskClass` to properly preserve class prototypes (e.g., ensuring `UserDTO` remains an instance of `UserDTO` after masking).

---

## v3.2.1 - 2025-10-16
- 🚀 Enhancements
 - Improved Middleware Architecture
 - Refactored Express middleware to use a lazy require loader instead of top-level await.
 - Removed dependency on dynamic import('express'), improving compatibility with both CJS and ESM users.
 - Middleware can now be initialized synchronously, allowing:
        
    ```ts
    import { Maskify } from 'maskify-ts';
    app.use(Maskify.middlewares.express({ fields: ['email', 'phone'] }));

    // or
    Maskify.use(app, {
        fields: ['email', 'phone'],
        maskOptions: { autoDetect: true }
    });
    ```
 - Field Configuration Update
    - Added support for per-field mask options in Express middleware: 
    ```ts
        fields: [
        { name: 'email', options: { type: 'email' } },
        { name: 'card', options: { type: 'card', maxAsterisks: 6 } },
        'phone'
        ];
    ```
   - The middleware now merges field-specific and global maskOptions safely.

## 🧩 Compatibility
 - Fully backward compatible with previous:
    ```ts
        Maskify.use(app, { fields: ['email', 'phone'] });
    ```
 - No breaking changes in public API.

## v3.2.0 - 2025-10-16
### Added
- ⚙️ **Express Middleware Support**
  - Added built-in middleware for Express:
    ```ts
    app.use(
        Maskify.middlewares.express({
            fields: [
            'email',
            { name: 'phone', options: { visibleEnd: 2 } }
            ],
            maskOptions: { autoDetect: true, maxAsterisks: 4 }
      })
    );
    ```
  - Automatically masks response fields according to schema or inferred type.
  - Works with dot-path and wildcard (`*`) notation.
  
### Improved
- 🧠 Auto-inference refined to detect emails, phone numbers, cards, and names using regex heuristics.
- 🧩 Middleware options now support **per-field configuration** and **global maskOptions** merging.

### Fixed
- 🧼 Build now clears `dist` before recompilation.
- 🧯 TypeScript definitions improved for peer dependency safety (Express optional import).

---

## [3.0.0] - 2025-10-15
### Added
- Core `Maskify` class for masking strings, objects, arrays, and nested fields.
- Auto-detection of sensitive types: email, phone, card, generic.
- Pattern-based masking support (`Maskify.pattern()`).
- `Maskify.maskSensitiveFields()` for deep object/array masking with schema.
- TypeScript-friendly with full generics and type inference.
- Dot-path and wildcard `*` support for nested objects and arrays.
- Built-in **Express** and **Fastify** middlewares for automatic response masking.
- Configurable `MaskOptions` including `maskChar`, `visibleStart`, `visibleEnd`, `maxAsterisks`, and `pattern`.
- Peer-dependency safe: dynamic imports of Express and Fastify to avoid runtime errors.
- Extendable masking strategies and custom patterns.
- 🧰 Codebase modularized with `MaskifyCore` and `middlewares` namespaces for better extensibility.
