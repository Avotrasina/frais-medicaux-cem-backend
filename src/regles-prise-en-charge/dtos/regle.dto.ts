import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  ValidateIf,
  Matches,
} from 'class-validator';
import {
  AgentConcerne,
  TypeRegle,
} from '../../generated/prisma/enums.js';

const MESSAGE_DATE = 'La date doit respecter le format AAAA-MM-JJ.';

export class CreerRegleDto {
  @IsEnum(TypeRegle, { message: 'Le type de règle est invalide.' })
  type!: TypeRegle;

  @IsEnum(AgentConcerne, { message: "L'agent concerné est invalide." })
  agentConcerne!: AgentConcerne;

  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    { message: 'Le taux CEM doit être un nombre avec deux décimales au maximum.' },
  )
  tauxCem!: number;

  @IsDateString({ strict: true }, { message: MESSAGE_DATE })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: MESSAGE_DATE })
  dateEffet!: string;

  @IsOptional()
  @IsDateString({ strict: true }, { message: MESSAGE_DATE })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: MESSAGE_DATE })
  dateFin?: string | null;
}

export class ModifierRegleDto {
  @ValidateIf((_objet: object, valeur: unknown) => valeur !== undefined)
  @IsEnum(TypeRegle, { message: 'Le type de règle est invalide.' })
  type?: TypeRegle;

  @ValidateIf((_objet: object, valeur: unknown) => valeur !== undefined)
  @IsEnum(AgentConcerne, { message: "L'agent concerné est invalide." })
  agentConcerne?: AgentConcerne;

  @ValidateIf((_objet: object, valeur: unknown) => valeur !== undefined)
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    { message: 'Le taux CEM doit être un nombre avec deux décimales au maximum.' },
  )
  tauxCem?: number;

  @ValidateIf((_objet: object, valeur: unknown) => valeur !== undefined)
  @IsDateString({ strict: true }, { message: MESSAGE_DATE })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: MESSAGE_DATE })
  dateEffet?: string;

  @IsOptional()
  @IsDateString({ strict: true }, { message: MESSAGE_DATE })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: MESSAGE_DATE })
  dateFin?: string | null;
}
