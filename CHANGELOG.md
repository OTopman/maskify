
---

```md
# Changelog

All notable changes to this project will be documented in this file.

## [3.2.0] - 2025-10-16
### Added
- ⚙️ **Express Middleware Support**
  - Added built-in middleware for Express:
    ```ts
    app.use(
      await Maskify.middlewares.express({
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
