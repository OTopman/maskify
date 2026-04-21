# Migration Guide: v3 to v4

## Breaking Changes

- `maskDeterministic()` now requires an explicit `secret` option and enforces a minimum secret length.
- Email masking now validates input through the core validator and supports strict validation mode.
- Build now requires `tsconfig.build.json` for dual-output packaging.

## Upgrade Checklist

1. Upgrade dependency: `npm install maskify-ts@^4`.
2. Ensure deterministic usage passes `{ secret: process.env.MASKIFY_SECRET }`.
3. Update CI/build scripts to run `npm run build`.
4. Re-run tests with `npm test` and validate any strict mode assumptions.

## New Structure Highlights

- `src/core/registry/registry.ts` supports injectable registries via `MaskerRegistry.create()`.
- `src/utils/config.ts` adds schema-validated config loading and `defineConfig()`.
- `src/utils/validator.ts` centralises input validation for strict-mode callers.
