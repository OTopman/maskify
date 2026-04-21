import { Maskify } from '../src';

const logLine =
  'login email=jane@company.com ip=192.168.1.10 auth=eyJhbGciOiJIUzI1NiJ9.payload.signature';

const safeLogLine = Maskify.smart(logLine);
console.log(safeLogLine);

console.log(
  Maskify.smart(
    'User jane@company.com logged in from 10.0.0.12 4111 1111 1111 1111',
  ),
);