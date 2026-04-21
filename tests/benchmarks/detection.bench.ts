import { Detectors } from '../../src/utils/detectors';
const { bench, run } = require('mitata');

bench('email detection', () => {
  Detectors.detectType('hello user@example.com');
});

run();
