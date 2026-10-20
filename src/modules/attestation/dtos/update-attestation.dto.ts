import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, MaxLength, Min,IsDate } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

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

  @ApiProperty({ type: String, format: "date-time" })
  @Type(() => Date)
  @IsDate()
  datePEC!: Date;
}