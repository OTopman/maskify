import { Maskify } from '../src';

export const prismaExtension = Maskify.middlewares.prisma({
  fields: ['email', 'token'],
});
