import { Module } from "@nestjs/common";
import { PrismaModule } from "../../infrastructure/prisma/prisma.module.js";
import { ConventionRepository } from "./convention.repository.js";

@Module({
  imports: [PrismaModule],
  providers: [ConventionRepository],
  exports: [ConventionRepository],
})
export class ConventionModule {}
