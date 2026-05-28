import { Maskify } from '../../src';
const { bench } = require('mitata');

bench('generic masking', () => {
  Maskify.mask('hello@example.com');
});
