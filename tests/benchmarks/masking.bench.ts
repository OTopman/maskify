import { Maskify } from '../../src';
const { bench, run } = require('mitata');

bench('generic masking', () => {
  Maskify.mask('hello@example.com');
});

run();
