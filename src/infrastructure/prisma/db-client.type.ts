import type { Prisma } from "../../generated/prisma/client.js";
import type { PrismaService } from "./prisma.service.js";

export type DbClient = PrismaService | Prisma.TransactionClient;
