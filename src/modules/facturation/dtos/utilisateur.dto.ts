import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { RoleUtilisateur } from '../../../generated/prisma/enums.js';

const nettoyerNom = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreerUtilisateurDto {
  @Transform(nettoyerNom)
  @IsString({ message: 'Le nom doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le nom est obligatoire.' })
  @Matches(/\S/, { message: 'Le nom ne peut pas être vide.' })
  nom!: string;

  @IsEnum(RoleUtilisateur, { message: 'Le rôle est invalide.' })
  role!: RoleUtilisateur;
}

export class ModifierUtilisateurDto {
  @IsOptional()
  @Transform(nettoyerNom)
  @IsString({ message: 'Le nom doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le nom ne peut pas être vide.' })
  @Matches(/\S/, { message: 'Le nom ne peut pas être vide.' })
  nom?: string;

  @IsOptional()
  @IsEnum(RoleUtilisateur, { message: 'Le rôle est invalide.' })
  role?: RoleUtilisateur;
}
