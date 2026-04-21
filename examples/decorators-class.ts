import 'reflect-metadata';
import { Mask, Maskify } from '../src';

class Account {
  @Mask({ type: 'email' })
  email = 'jane@company.com';

  @Mask({ type: 'phone' })
  phone = '+14155551234';

  role = 'admin';
}

const account = new Account();
const safe = Maskify.maskClass(account);

console.log(safe);
