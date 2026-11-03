import {
  IsDateString,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ServiceSortie } from '../../../generated/prisma/enums.js';
import { ApiPropertyOptional } from '@nestjs/swagger';

const MESSAGE_DATE = 'La date doit respecter le format AAAA-MM-JJ.';
const MESSAGE_TAUX_MONTANT =
  'Le montant doit être un nombre avec deux décimales au maximum.';

export class RemarqueObligatoireDto {
  @IsString({ message: 'La remarque doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'La remarque est obligatoire.' })
  @Matches(/\S/, { message: 'La remarque ne peut pas être vide.' })
  remarque!: string;
}

export class MotifObligatoireDto {
  @IsString({ message: 'Le motif doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le motif est obligatoire.' })
  @Matches(/\S/, { message: 'Le motif ne peut pas être vide.' })
  motif!: string;
}

export class RemarqueOptionnelleDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString({ message: 'La remarque doit être une chaîne de caractères.' })
  remarque?: string | null;
}

export class EnvoiValidationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: 'Le destinataire doit être un identifiant entier.' })
  @IsPositive({ message: 'Le destinataire doit être un identifiant positif.' })
  destinataireId?: number;

  @ApiPropertyOptional({
    description:
      'Autorise l’envoi malgré un écart de totaux, à justifier par une remarque.',
  })
  @IsOptional()
  @IsBoolean()
  confirmerEcartTotaux?: boolean;

  @ApiPropertyOptional({
    description: 'Obligatoire si un écart de totaux est confirmé.',
  })
  @IsOptional()
  @IsString()
  @Matches(/\S/, { message: 'La remarque ne peut pas être vide.' })
  remarque?: string;
}

export class ValidationFactureDto extends RemarqueOptionnelleDto {
  @ApiPropertyOptional({
    description:
      'Autorise la validation malgré un écart de totaux, à justifier par une remarque.',
  })
  @IsOptional()
  @IsBoolean()
  confirmerEcartTotaux?: boolean;
}

export class SortieFactureDto {
  @IsEnum(ServiceSortie, { message: 'Le service de sortie est invalide.' })
  service!: ServiceSortie;
}

export class ModifierFactureGlobaleDto {
  @ValidateIf((_objet: object, valeur: unknown) => valeur !== undefined)
  @IsInt({ message: 'Le prestataire doit être un identifiant entier.' })
  @IsPositive({ message: 'Le prestataire doit être un identifiant positif.' })
  prestataireId?: number;

  @ValidateIf((_objet: object, valeur: unknown) => valeur !== undefined)
  @IsString({ message: 'Le numéro de facture doit être une chaîne.' })
  @IsNotEmpty({ message: 'Le numéro de facture ne peut pas être vide.' })
  @Matches(/^\S(?:[\s\S]*\S)?$/, {
    message:
      'Le numéro de facture ne doit pas commencer ou se terminer par un espace.',
  })
  numFacture?: string;

  @ValidateIf((_objet: object, valeur: unknown) => valeur !== undefined)
  @IsDateString({ strict: true }, { message: MESSAGE_DATE })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: MESSAGE_DATE })
  dateFacture?: string;

  @ValidateIf((_objet: object, valeur: unknown) => valeur !== undefined)
  @IsDateString({ strict: true }, { message: MESSAGE_DATE })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: MESSAGE_DATE })
  dateReception?: string;

  @ValidateIf((_objet: object, valeur: unknown) => valeur !== undefined)
  @IsDateString({ strict: true }, { message: MESSAGE_DATE })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: MESSAGE_DATE })
  moisPrestation?: string;

  @IsOptional()
  @IsString({ message: "La référence d'agence doit être une chaîne." })
  refAgence?: string | null;

  @IsOptional()
  @IsString({ message: 'La remarque doit être une chaîne de caractères.' })
  remarque?: string | null;

  @ValidateIf((_objet: object, valeur: unknown) => valeur !== undefined)
  @IsString({ message: 'Le motif doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le motif ne peut pas être vide.' })
  @Matches(/\S/, { message: 'Le motif ne peut pas être vide.' })
  motif?: string;
}

export class ModifierMontantsFactureDto {
  @ValidateIf((_objet: object, valeur: unknown) => valeur !== undefined)
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    { message: MESSAGE_TAUX_MONTANT },
  )
  @IsPositive({ message: 'Le montant total doit être strictement positif.' })
  montantTotal?: number;

  @ValidateIf((_objet: object, valeur: unknown) => valeur !== undefined)
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    { message: MESSAGE_TAUX_MONTANT },
  )
  total100Cem?: number;

  @ValidateIf((_objet: object, valeur: unknown) => valeur !== undefined)
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    { message: MESSAGE_TAUX_MONTANT },
  )
  totalDepassement?: number;

  @ValidateIf((_objet: object, valeur: unknown) => valeur !== undefined)
  @IsString({ message: 'Le motif doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le motif ne peut pas être vide.' })
  @Matches(/\S/, { message: 'Le motif ne peut pas être vide.' })
  motif?: string;
}
