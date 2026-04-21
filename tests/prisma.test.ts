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

    // Simulate Prisma calling the extension hook (internal structure access)
    const result: any = await prismaMiddleware.query.$allModels.$allOperations(
      params
    );

    expect(result.email).not.toBe('test@example.com'); // Masked
    expect(result.email).toContain('@');
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

    const result: any = await prismaMiddleware.query.$allModels.$allOperations(
      params
    );

    expect(result.email).toBe('test@example.com'); // Untouched
  });
});
