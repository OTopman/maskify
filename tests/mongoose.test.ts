import { Maskify } from '../src/index';
import { GlobalConfigLoader } from '../src/utils/config';

describe('Mongoose Middleware', () => {
  beforeAll(() => {
    jest.spyOn(GlobalConfigLoader, 'load').mockReturnValue({});
  });

  it('should attach a .mask() method to the schema', () => {
    const mockSchema = {
      methods: {} as any,
      options: {},
      set: jest.fn(),
    };

    Maskify.middlewares.mongoose(mockSchema, {
      fields: ['password'],
    });

    expect(mockSchema.methods.mask).toBeDefined();

    // Simulate calling .mask() on a document
    const mockDoc = {
      password: 'supersecret',
      // Mongoose documents use toObject() to get plain data
      toObject: () => ({ password: 'supersecret' }),
    };

    const masked = mockSchema.methods.mask.call(mockDoc);
    expect(masked.password).toContain('****');
  });

  it('should register a toJSON transform if autoMaskJSON is true', () => {
    const mockSchema = {
      methods: {},
      options: { toJSON: {} },
      set: jest.fn(),
    };

    Maskify.middlewares.mongoose(mockSchema, {
      fields: ['ssn'],
      maskOptions: {
        maskChar: '*',
      },
    });

    // Verify schema.set('toJSON', ...) was called
    expect(mockSchema.set).toHaveBeenCalledWith(
      'toJSON',
      expect.objectContaining({
        transform: expect.any(Function),
      })
    );
  });
});
