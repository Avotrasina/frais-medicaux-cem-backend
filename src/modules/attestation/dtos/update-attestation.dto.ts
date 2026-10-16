import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class UpdatePartialAttestationDto {

  @IsOptional()
  @IsString()
  @MaxLength(255)
  naturePrestation?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  servicePrestataire?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  prestataireID?: number | null;

  @IsString()
  idpBeneficiaire?: string | null;
}