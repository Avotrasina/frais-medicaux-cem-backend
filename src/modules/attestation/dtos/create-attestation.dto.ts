import { Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateAttestationDto {

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  naturePrestation!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  servicePrestataire?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  providerID!: number;

  @IsString()
  @IsNotEmpty()
  idpBeneficiaire!: string;
}