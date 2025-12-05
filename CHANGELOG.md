
---

# Changelog

All notable changes to this project will be documented in this file.
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
