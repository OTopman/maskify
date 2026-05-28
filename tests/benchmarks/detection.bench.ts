import { Detectors } from '../../src/utils/detectors';
const { bench } = require('mitata');

bench('email detection', () => {
  Detectors.detectType('hello user@example.com');
});
