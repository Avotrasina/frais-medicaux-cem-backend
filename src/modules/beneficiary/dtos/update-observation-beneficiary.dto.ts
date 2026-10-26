import { IsOptional, IsString } from 'class-validator';

export class UpdateObservationBeneficiaryDto {
  @IsOptional()
  @IsString()
  observationIDP!: string | null;
}
