import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProviderCategoryDto {
  @IsString()
  @IsNotEmpty()
  nom!: string;
}

export class UpdateProviderCategoryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nom?: string;
}
