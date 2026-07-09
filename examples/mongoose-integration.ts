import { Schema, model } from 'mongoose';
import { Maskify } from '../src';

const UserSchema = new Schema({
  email: { type: String, required: true },
  phone: String,
  passwordHash: String,
});

// The plugin overrides toJSON on the schema and exposes explicit `.mask()` and `.maskAsync()`
// methods. The underlying document is never mutated — only the serialized
// representation is masked, so write operations stay correct.
UserSchema.plugin(Maskify.middlewares.mongoose, {
  fields: [
    { name: 'email', options: { type: 'email' } },
    { name: 'phone', options: { type: 'phone' } },
    'passwordHash',
  ],
});

export const User = model('User', UserSchema);

// Usage:
// const doc = await User.findById(id);
// res.json(doc);             // auto-masked via toJSON
// doc.mask();                // explicit helper (synchronous)
// await doc.maskAsync();     // explicit helper (asynchronous - supporting async maskers)
// doc.email;                 // raw value still available in memory
