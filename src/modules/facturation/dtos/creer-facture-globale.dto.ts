import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
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

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    example: '2026-03-01',
  })
  @IsOptional()
  @IsDateString({ strict: true }, { message: MESSAGE_DATE_ISO })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: MESSAGE_DATE_ISO })
  moisPrestation?: string;

  @ApiPropertyOptional({ type: String, example: 'AG-01' })
  @IsOptional()
  @IsString({ message: "La référence d'agence doit être une chaîne." })
  refAgence?: string;
}
