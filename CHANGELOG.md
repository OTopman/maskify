
---

```md
# Changelog

All notable changes to this project will be documented in this file.

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
