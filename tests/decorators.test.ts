import 'reflect-metadata';
import { Maskify, Mask } from '../src/index';
import { GlobalConfigLoader } from '../src/utils/config';

describe('Class Decorators', () => {
  // 🛡️ ISOLATION
  beforeAll(() => {
    jest.spyOn(GlobalConfigLoader, 'load').mockReturnValue({});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  class UserDTO {
    @Mask({ type: 'email' })
    email: string;

    @Mask({ type: 'phone' })
    phone: string;

    username: string; // No mask

    constructor(email: string, phone: string, username: string) {
      this.email = email;
      this.phone = phone;
      this.username = username;
    }
  }

  it('should mask properties decorated with @Mask', () => {
    const user = new UserDTO('test@example.com', '+1234567890', 'user123');

    // Original instance should be untouched
    expect(user.email).toBe('test@example.com');

    const masked = Maskify.maskClass(user);

    expect(masked.email).toContain('****');
    expect(masked.phone).toContain('****');
    expect(masked.username).toBe('user123');
  });

  it('should preserve the prototype of the masked object', () => {
    const user = new UserDTO('a', 'b', 'c');
    const masked = Maskify.maskClass(user);

    expect(masked).toBeInstanceOf(UserDTO);
  });
});
