import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Sexe } from '../types/personne.types.js';
import {StatutPEC, BackOfficeFrontOffice } from './enum.js';

export class AgentDto {
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
  @Type(() => Number)
  @IsInt()
  fonctionID?: number | null;

  @IsOptional()
  @IsString()
  categorieID?: string | null;

  @IsOptional()
  @IsString()
  codeDirection?: string | null;

  @IsOptional()
  @IsString()
  codeAgence?: string | null;

  @IsOptional()
  @IsString()
  codeService?: string | null;
}