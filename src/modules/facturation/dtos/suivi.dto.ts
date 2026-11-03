import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
} from 'class-validator';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CreerLigneSuiviDto {
  @IsString({ message: 'L’IDP doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'L’IDP est obligatoire.' })
  idp!: string;

  @IsInt({ message: 'L’acte doit être un identifiant entier.' })
  @IsPositive({ message: 'L’acte doit être un identifiant positif.' })
  acteId!: number;

  @IsDateString({ strict: true }, { message: 'La date de l’acte est invalide.' })
  @Matches(DATE, { message: 'La date de l’acte doit respecter le format AAAA-MM-JJ.' })
  dateActe!: string;

  @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false }, { message: 'Le montant doit avoir deux décimales au maximum.' })
  @IsPositive({ message: 'Le montant de l’acte doit être strictement positif.' })
  montantActe!: number;

  @IsOptional()
  @IsString({ message: 'Le libellé doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le libellé ne peut pas être vide.' })
  libelle?: string;
}

export class ModifierLigneSuiviDto {
  @IsOptional()
  @IsInt({ message: 'L’acte doit être un identifiant entier.' })
  @IsPositive({ message: 'L’acte doit être un identifiant positif.' })
  acteId?: number;

  @IsOptional()
  @IsDateString({ strict: true }, { message: 'La date de l’acte est invalide.' })
  @Matches(DATE, { message: 'La date de l’acte doit respecter le format AAAA-MM-JJ.' })
  dateActe?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false }, { message: 'Le montant doit avoir deux décimales au maximum.' })
  @IsPositive({ message: 'Le montant de l’acte doit être strictement positif.' })
  montantActe?: number;

  @IsOptional()
  @IsString({ message: 'Le libellé doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le libellé ne peut pas être vide.' })
  libelle?: string;
}
