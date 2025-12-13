import { express } from './express';
import { fastify } from './fastify';
import { mongoose } from './mongoose';
import { prisma } from './prisma';
import { typeorm } from './typeorm';

export const middlewares = {
  express,
  fastify,
  mongoose,
  prisma,
  typeorm,
};
