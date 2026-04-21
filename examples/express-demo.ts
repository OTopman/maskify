import express from 'express';
import { Maskify } from 'maskify-ts';

const app = express();
app.use(express.json());

Maskify.use(
  app,
  {
    fields: [
      'data.*.email',
      '*.phone',
      { name: '[*].cards.*.number', options: { type: 'card' } },
    ],
    maskOptions: { maxAsterisks: 4, autoDetect: true },
  },
  'express',
);

app.get('/users', (_req, res) => {
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

  res.json({ status: 'success', data: users });
});

app.listen(3000, () => {
  // eslint-disable-next-line no-console
  console.log('Express demo running on http://localhost:3000');
});
