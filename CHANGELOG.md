
---

```md
# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-10-15
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
