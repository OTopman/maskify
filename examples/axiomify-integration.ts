import { Maskify } from '../src';

// `app` is an Axiomify instance (https://github.com/OTopman/axiomify).
// Untyped here on purpose — same convention as the Prisma/Mongoose/TypeORM
// adapters, since @axiomify/core isn't a peer dependency of maskify-ts.
declare const app: any;

Maskify.middlewares.axiomify(app, {
  fields: [
    { name: 'email', options: { type: 'email' } },
    { name: 'phone', options: { type: 'phone' } },
  ],
});

// Usage:
// app.route({
//   method: 'GET',
//   path: '/users/:id',
//   handler: (req, res) => res.send({ id: req.params.id, email: 'jane@company.com' }),
// });
// → response body is masked before it's written to the socket.
//
// Masking here is synchronous only: Axiomify's res.send() serializes and
// writes to the socket before returning, so async custom maskers (e.g. the
// WebCrypto deterministic masker) aren't supported through this adapter —
// mask those fields inside the handler before calling res.send() instead.
