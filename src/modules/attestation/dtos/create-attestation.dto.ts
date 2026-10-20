import { Type } from "class-transformer";
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

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

  @ApiProperty({ type: String, format: "date-time" })
  @Type(() => Date)
  @IsDate()
  datePEC!: Date;
}