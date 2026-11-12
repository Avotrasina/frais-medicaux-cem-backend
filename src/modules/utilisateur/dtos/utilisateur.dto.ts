import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { RoleUtilisateur } from '../../../generated/prisma/enums.js';

const nettoyerNom = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const normaliserEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class CreerUtilisateurDto {
  @Transform(nettoyerNom)
  @IsString({ message: 'Le nom doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le nom est obligatoire.' })
  @Matches(/\S/, { message: 'Le nom ne peut pas être vide.' })
  nom!: string;

  @IsEnum(RoleUtilisateur, { message: 'Le rôle est invalide.' })
  role!: RoleUtilisateur;

  @Transform(nettoyerNom)
  @IsString({ message: 'Le nom utilisateur doit être une chaîne.' })
  @IsNotEmpty({ message: 'Le nom utilisateur est obligatoire.' })
  @Matches(/\S/, { message: 'Le nom utilisateur ne peut pas être vide.' })
  @MaxLength(100)
  username!: string;

  @Transform(normaliserEmail)
  @IsEmail({}, { message: 'L’adresse e-mail est invalide.' })
  @MaxLength(254)
  email!: string;

  @IsString({ message: 'Le mot de passe doit être une chaîne.' })
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères.',
  })
  @MaxLength(128, {
    message: 'Le mot de passe ne peut pas dépasser 128 caractères.',
  })
  @Matches(/\S/, { message: 'Le mot de passe ne peut pas être vide.' })
  mdp!: string;
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

  @ValidateIf((_objet: object, valeur: unknown) => valeur !== undefined)
  @Transform(nettoyerNom)
  @IsString({ message: 'Le nom utilisateur doit être une chaîne.' })
  @IsNotEmpty({ message: 'Le nom utilisateur ne peut pas être vide.' })
  @Matches(/\S/, { message: 'Le nom utilisateur ne peut pas être vide.' })
  @MaxLength(100)
  username?: string;

  @ValidateIf((_objet: object, valeur: unknown) => valeur !== undefined)
  @Transform(normaliserEmail)
  @IsEmail({}, { message: 'L’adresse e-mail est invalide.' })
  @MaxLength(254)
  email?: string;

  @ValidateIf((_objet: object, valeur: unknown) => valeur !== undefined)
  @IsString({ message: 'Le mot de passe doit être une chaîne.' })
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères.',
  })
  @MaxLength(128, {
    message: 'Le mot de passe ne peut pas dépasser 128 caractères.',
  })
  @Matches(/\S/, { message: 'Le mot de passe ne peut pas être vide.' })
  mdp?: string;
}
