import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Min,
} from 'class-validator';

const MESSAGE_DATE_ISO = 'La date doit respecter le format AAAA-MM-JJ.';

export class CreerFactureGlobaleDto {
  @IsInt({ message: 'Le prestataire doit être un identifiant entier.' })
  @Min(1, { message: 'Le prestataire doit être un entier positif.' })
  prestataireId!: number;

  @IsString({ message: 'Le numéro de facture doit être une chaîne.' })
  @IsNotEmpty({ message: 'Le numéro de facture est obligatoire.' })
  @Matches(/^\S(?:[\s\S]*\S)?$/, {
    message:
      'Le numéro de facture ne doit pas commencer ou se terminer par un espace.',
  })
  numFacture!: string;

  @IsDateString({ strict: true }, { message: MESSAGE_DATE_ISO })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: MESSAGE_DATE_ISO })
  dateFacture!: string;

  @IsDateString({ strict: true }, { message: MESSAGE_DATE_ISO })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: MESSAGE_DATE_ISO })
  dateReception!: string;

  @IsDateString({ strict: true }, { message: MESSAGE_DATE_ISO })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: MESSAGE_DATE_ISO })
  moisPrestation!: string;

  @IsOptional()
  @IsString({ message: "La référence d'agence doit être une chaîne." })
  refAgence?: string;

  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    {
      message:
        'Le montant total doit être un nombre avec deux décimales au maximum.',
    },
  )
  @IsPositive({ message: 'Le montant total doit être strictement positif.' })
  montantTotal!: number;

  @IsOptional()
  @IsString({ message: 'La remarque doit être une chaîne.' })
  remarque?: string;
}
