import { PrismaClient } from '../generated/prisma/index.js';

// Create a singleton instance of Prisma Client
const prisma = new PrismaClient();

export default prisma;
