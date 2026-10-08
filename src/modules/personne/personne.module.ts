import { Module } from "@nestjs/common";
import { PersonneRepository } from "./personne.repository.js";

@Module({
  providers: [PersonneRepository],
  exports: [PersonneRepository],
})
export class PersonneModule {}