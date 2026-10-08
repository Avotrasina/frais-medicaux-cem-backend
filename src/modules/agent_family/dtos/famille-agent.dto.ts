import { Type } from "class-transformer";
import { IsDate, IsEnum, IsNotEmpty, IsString, IsOptional } from "class-validator";
import { Sexe } from "../../agent/types/personne.types.js";

class FamilleAgentInputBaseDto {
  @IsString()
  @IsNotEmpty()
  agentMatricule!: string;

  @IsString()
  @IsNotEmpty()
  nom!: string;

  @IsString()
  @IsNotEmpty()
  prenom!: string;

  @Type(() => Date)
  @IsDate()
  dateNaissance!: Date;

  @IsEnum(Sexe)
  sexe!: Sexe;
}

export class UpdatePartialFamilleAgentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nom?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  prenom?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateNaissance?: Date;

  @IsOptional()
  @IsEnum(Sexe)
  sexe?: Sexe;
}

export class ConjointInputDto extends FamilleAgentInputBaseDto {}
export class EnfantInputDto extends FamilleAgentInputBaseDto {}