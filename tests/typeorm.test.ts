import 'reflect-metadata';
import { Mask, Maskify } from '../src/index';
import { GlobalConfigLoader } from '../src/utils/config';

describe('TypeORM Middleware', () => {
  beforeAll(() => {
    jest.spyOn(GlobalConfigLoader, 'load').mockReturnValue({});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  class UserEntity {
    @Mask({ type: 'email' })
    email: string;

    name: string;

    constructor(email: string, name: string) {
      this.email = email;
      this.name = name;
    }
  }

  it('masks decorated fields on JSON serialization without mutating the entity', () => {
    const subscriber = Maskify.middlewares.typeorm();
    const entity = new UserEntity('user@test.com', 'John Doe');

    subscriber.afterLoad(entity);

    // Entity in memory is still the original — protects TypeORM's change tracking
    // from persisting masked data on subsequent saves.
    expect(entity.email).toBe('user@test.com');

    const serialized = JSON.parse(JSON.stringify(entity));
    expect(serialized.email).not.toBe('user@test.com');
    expect(serialized.email).toContain('@');
    expect(serialized.name).toBe('John Doe');
  });

  it('respects schema-based field config on serialization', () => {
    const subscriber = Maskify.middlewares.typeorm({
      fields: [{ name: 'name', options: { type: 'name' } }],
    });
    const entity = new UserEntity('user@test.com', 'John Doe');

    subscriber.afterLoad(entity);

    const serialized = JSON.parse(JSON.stringify(entity));
    expect(entity.name).toBe('John Doe');
    expect(serialized.name).not.toBe('John Doe');
  });

  it('no-ops on null or non-object entities', () => {
    const subscriber = Maskify.middlewares.typeorm();
    expect(() => subscriber.afterLoad(null)).not.toThrow();
    expect(() => subscriber.afterLoad(undefined)).not.toThrow();
  });
});
