import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateAgentCategoryDto {
  @IsString()
  @IsNotEmpty()
  codeCategory!: string;
}

export class UpdateAgentCategoryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  codeCategory?: string;
}