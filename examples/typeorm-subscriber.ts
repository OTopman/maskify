import 'reflect-metadata';
import { TypeORMSubscriber } from '../src/middlewares/typeorm';
import { Mask } from '../src/decorators/mask';

class UserEntity {
  @Mask({ type: 'email' })
  email!: string;

  @Mask({ type: 'phone' })
  phone!: string;
}

// Register the subscriber on your DataSource, e.g.:
//   new DataSource({ subscribers: [subscriber], ... })
const subscriber = new TypeORMSubscriber({
  fields: [{ name: 'email', options: { type: 'email' } }],
});

const entity = Object.assign(new UserEntity(), {
  email: 'jane@company.com',
  phone: '+14155551234',
});

// afterLoad installs a non-enumerable `toJSON` on the entity.
// The in-memory entity is NEVER mutated — this is critical so TypeORM's
// UnitOfWork can't accidentally persist masked values on the next save().
subscriber.afterLoad(entity);

console.log(entity.email);           // 'jane@company.com'   ← raw (for internal use/save)
console.log(JSON.stringify(entity)); // '{"email":"j***@c******.com", ...}'  ← masked on serialize
console.log((entity as any).toJSON()); // { email: 'j***@c******.com', ... } ← masked plain object
