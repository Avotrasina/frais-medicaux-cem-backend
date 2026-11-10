import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Validate,
  ValidateIf,
  ValidateNested,
  type ValidationArguments,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';
import { RegimeActe, UnitePlafond } from '../../../generated/prisma/enums.js';

export class PlafondParActeDto {
  @ApiProperty({ type: Number, minimum: 0.01, example: 100000 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Le montant par acte doit avoir au maximum deux décimales.' },
  )
  @IsPositive({ message: 'Le montant par acte doit être supérieur à zéro.' })
  montant!: number;
}

export class PlafondParAnBaseDto {
  @ApiProperty({ enum: UnitePlafond, example: UnitePlafond.MONTANT })
  @IsEnum(UnitePlafond, { message: 'L’unité annuelle est invalide.' })
  unite!: UnitePlafond;
}

export class PlafondParAnMontantDto extends PlafondParAnBaseDto {
  @IsIn([UnitePlafond.MONTANT], {
    message: 'L’unité doit être MONTANT.',
  })
  declare unite: typeof UnitePlafond.MONTANT;

  @ApiProperty({ type: Number, minimum: 0.01, example: 500000 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Le montant annuel doit avoir au maximum deux décimales.' },
  )
  @IsPositive({ message: 'Le montant annuel doit être supérieur à zéro.' })
  montant!: number;
}

export class PlafondParAnSeancesDto extends PlafondParAnBaseDto {
  @IsIn([UnitePlafond.SEANCES], {
    message: 'L’unité doit être SEANCES.',
  })
  declare unite: typeof UnitePlafond.SEANCES;

  @ApiProperty({ type: Number, minimum: 1, example: 12 })
  @IsInt({ message: 'Le nombre annuel de séances doit être un entier.' })
  @IsPositive({
    message: 'Le nombre annuel de séances doit être supérieur à zéro.',
  })
  nbSeances!: number;
}

export class PlafondParAnDto extends PlafondParAnBaseDto {
  @ValidateIf(
    (plafond: PlafondParAnDto) => plafond.unite === UnitePlafond.MONTANT,
  )
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Le montant annuel doit avoir au maximum deux décimales.' },
  )
  @IsPositive({ message: 'Le montant annuel doit être supérieur à zéro.' })
  montant?: number;

  @ValidateIf(
    (plafond: PlafondParAnDto) => plafond.unite === UnitePlafond.SEANCES,
  )
  @IsInt({ message: 'Le nombre annuel de séances doit être un entier.' })
  @IsPositive({
    message: 'Le nombre annuel de séances doit être supérieur à zéro.',
  })
  nbSeances?: number;
}

export class PlafondsCreationDto {
  @ApiPropertyOptional({ type: PlafondParActeDto })
  @ValidateIf((dto: PlafondsCreationDto) => dto.parActe !== undefined)
  @IsObject({ message: 'Le plafond par acte doit être un objet.' })
  @ValidateNested()
  @Type(() => PlafondParActeDto)
  parActe?: PlafondParActeDto;

  @ApiPropertyOptional({
    oneOf: [
      { $ref: '#/components/schemas/PlafondParAnMontantDto' },
      { $ref: '#/components/schemas/PlafondParAnSeancesDto' },
    ],
  })
  @ValidateIf((dto: PlafondsCreationDto) => dto.parAn !== undefined)
  @IsObject({ message: 'Le plafond annuel doit être un objet.' })
  @ValidateNested()
  @Type(() => PlafondParAnDto, {
    discriminator: {
      property: 'unite',
      subTypes: [
        { name: UnitePlafond.MONTANT, value: PlafondParAnMontantDto },
        { name: UnitePlafond.SEANCES, value: PlafondParAnSeancesDto },
      ],
    },
    keepDiscriminatorProperty: true,
  })
  parAn?: PlafondParAnDto;
}

@ValidatorConstraint({ name: 'actePayloadShape', async: false })
class ActePayloadShapeConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args?: ValidationArguments): boolean {
    const body = args?.object as Record<string, unknown> | undefined;
    if (body === undefined) return false;
    const type = body.type;
    if (type !== undefined && type !== 'ACTE' && type !== 'CATEGORIE') {
      return false;
    }
    if (type === 'CATEGORIE') {
      return (
        body.code === undefined &&
        body.nomActe === undefined &&
        body.listeLibelle === undefined &&
        body.regime === undefined &&
        body.categorieActeId === undefined
      );
    }
    return body.nomCategorie === undefined;
  }

  defaultMessage(): string {
    return 'Les champs fournis ne correspondent pas au type de création demandé.';
  }
}

export class CreateActeRequestDto {
  @ApiPropertyOptional({ enum: ['ACTE', 'CATEGORIE'], example: 'ACTE' })
  @Validate(ActePayloadShapeConstraint)
  @ValidateIf((body: CreateActeRequestDto) => body.type !== undefined)
  @IsIn(['ACTE', 'CATEGORIE'], {
    message: 'Le type doit être ACTE ou CATEGORIE.',
  })
  type?: 'ACTE' | 'CATEGORIE';

  @ApiPropertyOptional({ example: 'CON-01' })
  @Validate(ActePayloadShapeConstraint)
  @ValidateIf(
    (body: CreateActeRequestDto) =>
      body.type === 'ACTE' || body.type === undefined,
  )
  @IsString()
  @IsNotEmpty()
  code?: string;

  @ApiPropertyOptional({ example: 'Consultation généraliste' })
  @ValidateIf(
    (body: CreateActeRequestDto) =>
      body.type === 'ACTE' || body.type === undefined,
  )
  @IsString()
  @IsNotEmpty()
  nomActe?: string;

  @ApiPropertyOptional({ example: 'Consultation généraliste' })
  @ValidateIf(
    (body: CreateActeRequestDto) =>
      body.type === 'ACTE' || body.type === undefined,
  )
  @IsString()
  @IsNotEmpty()
  listeLibelle?: string;

  @ApiPropertyOptional({ enum: RegimeActe })
  @ValidateIf(
    (body: CreateActeRequestDto) =>
      body.type === 'ACTE' || body.type === undefined,
  )
  @IsEnum(RegimeActe)
  regime?: RegimeActe;

  @ApiPropertyOptional({ type: Number, example: 4 })
  @ValidateIf(
    (body: CreateActeRequestDto) =>
      body.type === 'ACTE' || body.type === undefined,
  )
  @IsInt()
  @IsPositive()
  categorieActeId?: number;

  @ApiPropertyOptional({ example: 'Soins dentaires' })
  @Validate(ActePayloadShapeConstraint)
  @ValidateIf((body: CreateActeRequestDto) => body.type === 'CATEGORIE')
  @IsString()
  @IsNotEmpty()
  nomCategorie?: string;

  @ApiPropertyOptional({ type: PlafondsCreationDto })
  @ValidateIf((body: CreateActeRequestDto) => body.plafonds !== undefined)
  @IsObject({
    message: 'Les plafonds doivent être fournis sous forme d’objet.',
  })
  @ValidateNested()
  @Type(() => PlafondsCreationDto)
  plafonds?: PlafondsCreationDto;

  @ApiPropertyOptional({ type: String, format: 'date', example: '2026-01-01' })
  @IsOptional()
  @IsDateString({}, { message: 'La date d’effet est invalide.' })
  dateEffet?: string;
}

export type PlafondsCreation = PlafondsCreationDto;

export class CreateCategorieWithCeilingsDto {
  @ApiProperty({ example: 'Soins dentaires' })
  @IsString()
  @IsNotEmpty()
  nomCategorie!: string;

  @ApiPropertyOptional({ type: PlafondsCreationDto })
  @ValidateIf(
    (body: CreateCategorieWithCeilingsDto) => body.plafonds !== undefined,
  )
  @IsObject({
    message: 'Les plafonds doivent être fournis sous forme d’objet.',
  })
  @ValidateNested()
  @Type(() => PlafondsCreationDto)
  plafonds?: PlafondsCreationDto;

  @ApiPropertyOptional({ type: String, format: 'date', example: '2026-01-01' })
  @IsOptional()
  @IsDateString({}, { message: 'La date d’effet est invalide.' })
  dateEffet?: string;
}
