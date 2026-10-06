import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";

export type DbClient = PrismaClient | Prisma.TransactionClient;