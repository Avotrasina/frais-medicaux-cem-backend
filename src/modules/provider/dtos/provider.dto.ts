import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { Type } from "class-transformer";
import { ProviderStatus } from "../types/provider.types.js";

export class CreateProviderDto {
  @IsString()
  @IsNotEmpty()
  nom!: string;

  @IsString()
  @IsNotEmpty()
  adresse!: string;

  @IsEnum(ProviderStatus)
  statut!: ProviderStatus;

  @IsString()
  @IsNotEmpty()
  nif!: string;

  @IsString()
  @IsNotEmpty()
  stat!: string;

  @Type(() => Date)
  @IsDate()
  dateDebutConvention!: Date;

  @Type(() => Date)
  @IsDate()
  dateFinConvention!: Date;

  @IsString()
  @IsNotEmpty()
  listePrestation!: string;

  @Type(() => Number)
  @IsInt()
  lieuID!: number;

  @Type(() => Number)
  @IsInt()
  categorieID!: number;
}

export class UpdateProviderDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nom?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  adresse?: string;

  @IsOptional()
  @IsEnum(ProviderStatus)
  statut?: ProviderStatus;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nif?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  stat?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateDebutConvention?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateFinConvention?: Date;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  listePrestation?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  lieuID?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categorieID?: number;
}