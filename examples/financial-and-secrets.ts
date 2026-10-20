import { Maskify, isValidIban, isValidSsn, m } from '../src';

// 1. Direct Maskers & Checksum Validators
const ibanSample = 'GB82 WEST 1234 5698 7654 32';
console.log('Is valid IBAN:', isValidIban(ibanSample)); // true
console.log('Masked IBAN:', Maskify.iban(ibanSample));
// Output: GB82 **** **** **** **54 32

const ssnSample = '123-45-6789';
console.log('Is valid SSN:', isValidSsn(ssnSample)); // true
console.log('Masked SSN:', Maskify.ssn(ssnSample));
// Output: ***-**-6789

const awsKey = 'AKIAIOSFODNN7EXAMPLE';
console.log('Masked AWS Key:', Maskify.secret(awsKey));
// Output: AKIA****************

// 2. High-performance JIT-compiled Schema
const payrollSchema = m.object({
  employee: m.name(),
  ssn: m.ssn(),
  bankIban: m.iban(),
  apiToken: m.secret(),
});

const employeeRecord = {
  employee: 'John Doe',
  ssn: '123-45-6789',
  bankIban: 'DE89370400440532013000',
  apiToken: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz',
};

console.log('JIT Schema Output:', payrollSchema(employeeRecord));
// Output:
// {
//   employee: 'J*** D**',
//   ssn: '***-**-6789',
//   bankIban: 'DE89**************3000',
//   apiToken: 'ghp_************************************'
// }

// 3. Free-Text Log Scanning via Maskify.smart()
const rawLog = `
[ERROR] Worker failed during payout:
User: jane@example.com (SSN: 123-45-6789)
Target Account: GB82 WEST 1234 5698 7654 32
AWS Request ID with Key AKIAIOSFODNN7EXAMPLE
`;

console.log('Smart Log Sanitizer:');
console.log(Maskify.smart(rawLog));
