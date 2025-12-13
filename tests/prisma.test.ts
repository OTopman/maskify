import { Maskify } from '../src/index';
import { GlobalConfigLoader } from '../src/utils/config';

describe('Prisma Middleware', () => {
  beforeAll(() => {
    jest.spyOn(GlobalConfigLoader, 'load').mockReturnValue({});
  });

  it('should mask data on read operations', async () => {
    const prismaMiddleware = Maskify.middlewares.prisma({
      fields: ['email'],
      maskOptions: { maskChar: '*' },
    });

    const mockData = { id: 1, email: 'test@example.com' };
    // Mock the "next" query function Prisma calls
    const mockQuery = jest.fn().mockResolvedValue(mockData);

    const params = {
      model: 'User',
      operation: 'findUnique',
      args: {},
      query: mockQuery,
    };

    // Simulate Prisma calling the extension hook
    // @ts-ignore - accessing internal structure for testing
    const result = await prismaMiddleware.query.$allModels.$allOperations(
      params
    );

    expect(result.email).toBe('****@***.com'); // Masked!
  });

  it('should NOT mask data on write operations', async () => {
    const prismaMiddleware = Maskify.middlewares.prisma({
      fields: ['email'],
    });

    const mockData = { id: 1, email: 'test@example.com' };
    const mockQuery = jest.fn().mockResolvedValue(mockData);

    const params = {
      model: 'User',
      operation: 'create', // Write op
      args: {},
      query: mockQuery,
    };

    // @ts-ignore
    const result = await prismaMiddleware.query.$allModels.$allOperations(
      params
    );

    expect(result.email).toBe('test@example.com'); // Untouched
  });
});
