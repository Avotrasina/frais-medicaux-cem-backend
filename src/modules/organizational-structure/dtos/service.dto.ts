import { IsNotEmpty, IsString } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  codeService!: string;

  @IsString()
  @IsNotEmpty()
  nomService!: string;

  @IsString()
  @IsNotEmpty()
  codeDirection!: string;
}

export class UpdateServiceNomDto {
  @IsString()
  @IsNotEmpty()
  nomService!: string;
}

export class UpdateServiceCodeDirectionDto {
  @IsString()
  @IsNotEmpty()
  codeDirection!: string;
}
