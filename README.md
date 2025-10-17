# Maskify

Maskify is a lightweight, zero-dependency TypeScript utility for safely masking sensitive data in strings, objects, arrays, and deeply nested structures — with full dot-path and wildcard (*) support. 

It’s ideal for logging, analytics, and compliance scenarios (e.g., GDPR/PII redaction) where sensitive data must be obscured.


## ⚡️ Features
- ✅ Mask strings, objects, arrays, and nested fields
- ✅ Dot-path and wildcard (*) traversal support
- ✅ Schema-based configuration per field
- ✅ Non-destructive (returns deep clones)
- ✅ TypeScript-friendly with inferred generics
- ✅ Auto-detect sensitive types: email, phone, card, etc.
- ✅ Pattern-based masking (`#### **** ####`)  
- ✅ Express middleware support (Maskify.use or Maskify.middlewares.express)
- ✅ Extendable mask patterns and custom strategies


## Installation

```bash
npm install maskify

# or 

yarn add maskify
```

Note: Express is peer dependencies if you want to use the middleware.

```bash 
npm install express
```


## 🚀 Quickstart


```ts
import { Maskify } from 'maskify';


// Mask individual values
const maskedEmail = Maskify.mask('john.doe@example.com', { type: 'email' });
console.log(maskedEmail); // jo****@e****.com

// Mask with explicit type
const maskedPhone = Maskify.mask('+2348012345678', { type: 'phone' });
console.log(maskedPhone);

// Mask with pattern
const maskedCard = Maskify.pattern('1234567890123456', '#### **** **** ####');
console.log(maskedCard); 

// Mask objects
const user = {
email: 'john.doe@example.com',
phone: '+2348012345678'
};


const maskedUser = Maskify.maskSensitiveFields(user, {
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

const masked = Maskify.maskSensitiveFields(users, {
  email: { type: 'email' },
  'profile.email': { type: 'email' },
  'contacts.*.phone': { type: 'phone' },
  'cards[0].number': { type: 'card' }
});

console.log(masked);

```

## Middleware Support

### Express
```ts 
import express from 'express';
import { Maskify } from './maskify';

const app = express();
app.use(express.json());

// Attach Maskify middleware
bootstrap();

async function bootstrap() {
   Maskify.use(
    app,
    {
      fields: ['*.email', '*.phone', { name: '[*].cards.*.number', options: { type: 'card' }}], // paths to mask
      maskOptions: { maxAsterisks: 4, autoDetect: true }, // optional global mask options
    },
    'express'
  );

    // or
    const middleware =  Maskify.middlewares.express({
      fields: ['email', 'phone'],
    });

    app.use(middleware);

  // Sample route
  app.get('/users', (req, res) => {
    const users = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+2348012345678',
        cards: [{ number: '1234123412341234' }],
      },
      {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        phone: '+2348098765432',
        cards: [{ number: '4321432143214321' }],
      },
    ];

    res.json(users);
  });

  app.listen(3000, () => {
    console.log('Express server running on http://localhost:3000');
  });
}
```

## Mask Options

```ts
interface MaskOptions {
  visibleStart?: number; // Number of visible characters at the start
  visibleEnd?: number;   // Number of visible characters at the end
  maxAsterisks?: number; // Maximum number of 'maskChar' or '*' in masked string
  autoDetect?: boolean;  // Automatically detect type (default: true)
  type?: 'email' | 'phone' | 'card' | 'generic'; // Force a specific type
  maskChar?: string;     // Character used for masking (default: '*')
  pattern?: string;      // Custom pattern like '#### **** ####' or #{4} *{4} #{4}
}
```

## Maskable Types
- email, phone, card, and more.
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