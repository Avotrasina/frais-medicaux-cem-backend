import { Type } from "class-transformer";
import { IsDate, IsEnum, IsNotEmpty, IsString, IsOptional, IsInt } from "class-validator";
import { Sexe } from "../../personne/personne.types.js";
import { ApiProperty } from "@nestjs/swagger";

class AgentFamilyBaseInputDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  agentMatricule!: number;

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

export class ConjointInputDto extends AgentFamilyBaseInputDto {}
export class EnfantInputDto extends AgentFamilyBaseInputDto {}

export class AgentFamilyCreateMultipartDto extends AgentFamilyBaseInputDto {
  @ApiProperty({ type: "string", format: "binary" })
  image!: any;
}

export class AgentFamilySocialCardMultipartDto{
  @ApiProperty({ type: "string", format: "binary" })
  image!: any;  
}
