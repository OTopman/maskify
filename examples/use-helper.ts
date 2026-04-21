import express from 'express';
import { Maskify } from '../src';

const app = express();

Maskify.use(
  app,
  {
    fields: ['email', 'password'],
    maskOptions: { autoDetect: true },
  },
  'express',
);
