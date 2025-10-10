# Maskify

Maskify is a lightweight, zero-dependency TypeScript utility for safely masking sensitive data in strings, objects, arrays, and deeply nested structures — with full dot-path and wildcard (*) support. 

It’s ideal for logging, analytics, and compliance scenarios (e.g., GDPR/PII redaction) where sensitive data must be obscured.


## ⚡️ Features
- ✅ Mask strings, objects, arrays, and nested fields
- ✅ Dot-path and wildcard (*) traversal support
- ✅ Schema-based configuration per field
- ✅ Non-destructive (returns deep clones)
- ✅ TypeScript-friendly with inferred generics
- ✅ Extendable mask patterns and custom strategies


## Installation

```bash
npm install maskify

# or 

yarn add maskify
```


## 🚀 Quickstart


```ts
import { Masker } from 'maskify';


// Mask individual values
const maskedEmail = Masker.mask('john.doe@example.com', { type: 'email' });
console.log(maskedEmail); // jo****@e****.com


// Mask objects
const user = {
email: 'john.doe@example.com',
phone: '+2348012345678'
};


const maskedUser = Masker.maskSensitiveFields(user, {
email: { type: 'email' },
phone: { type: 'phone' }
});
console.log(maskedUser);


// Mask array of object
const users = [
  {
    email: 'user1@example.com',
    profile: { email: 'profile@example.com' },
    contacts: [{ phone: '+2348012345678' }, { phone: '+2348098765432' }],
    cards: [{ number: '1234123412341234' }]
  }
];

const masked = Masker.maskSensitiveFields(users, {
  email: { type: 'email' },
  'profile.email': { type: 'email' },
  'contacts.*.phone': { type: 'phone' },
  'cards[0].number': { type: 'card' }
});

console.log(masked);

```


## Mask Options

```ts
interface MaskOptions {
  visibleStart?: number; // Number of visible characters at the start
  visibleEnd?: number;   // Number of visible characters at the end
  maxAsterisks?: number; // Maximum number of '*' in masked string
  autoDetect?: boolean;  // Automatically detect type (default: true)
  type?: 'email' | 'phone' | 'card' | 'generic'; // Force a specific type
}

```

## Maskable Types
- email, phone, card, password, pin, token, bvn, nin, dob, ssn, and more.
- You can also specify your custom property



## Contributing
Contributions are welcome! Please fork the repository and submit a pull request.


## License
MIT License

Copyright (c) 2025 Temitope Okunlola

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:


The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.


THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.