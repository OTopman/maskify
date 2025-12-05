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

  it('should mask entity in-place on afterLoad', () => {
    const subscriber = Maskify.middlewares.typeorm();
    const entity = new UserEntity('user@test.com', 'John Doe');

    // Simulate TypeORM hook
    subscriber.afterLoad(entity);

    // Expect default masking (****@***.com)
    expect(entity.email).toContain('****');
    expect(entity.name).toBe('John Doe');
  });
});
