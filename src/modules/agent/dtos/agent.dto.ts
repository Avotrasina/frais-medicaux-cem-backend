import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type,Expose } from 'class-transformer';
import { PartialType, OmitType } from "@nestjs/mapped-types";
import { Sexe } from '../../personne/personne.types.js';
import {StatutPEC, BackOfficeFrontOffice } from './enum.js';
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class AgentInputDto {
  @IsString()
  @IsNotEmpty()
  matricule!: string;

  @IsString()
  @IsNotEmpty()
  nom!: string;

  @IsString()
  @IsNotEmpty()
  prenom!: string;

  @IsEnum(StatutPEC)
  statutPEC!: StatutPEC;

  @Type(() => Date)
  @IsDate()
  dateNaissance!: Date;

  @IsEnum(Sexe)
  sexe!: Sexe;

  @IsEnum(BackOfficeFrontOffice)
  backOfficeFrontOffice!: BackOfficeFrontOffice;

  @IsOptional()
  @IsString()
  observationMatricule?: string | null;

  @Type(() => Date)
  @IsDate()
  dateEntree!: Date;

  @IsOptional()
  @IsString()
  fonction?: string | null;

  @IsOptional()
  @IsString()
  categorieID?: string | null;

  @IsOptional()
  @IsString()
  structureID?: string | null;

  @IsOptional()
  @IsString()
  codeService?: string | null;

}


export class AgentUpdateDto extends PartialType(
  OmitType(AgentInputDto, ["matricule"] as const),
) {
  nom?: string;
  prenom?: string;
  statutPEC?: StatutPEC;
  dateNaissance?: Date;
  sexe?: Sexe;
  backOfficeFrontOffice?: BackOfficeFrontOffice;
  observationMatricule?: string | null;
  dateEntree?: Date;
  fonction?: string | null;
  categorieID?: string | null;
  structureID?: string | null;
  codeService?: string | null;
}



export class AgentSearchNameDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  value!: string;
}

export class AgentCreateMultipartDto extends AgentInputDto {
  @ApiProperty({ type: "string", format: "binary" })
  image!: any;
}

export class AgentCardMultipartDto {
  @ApiProperty({ type: "string", format: "binary" })
  image!: any;
}