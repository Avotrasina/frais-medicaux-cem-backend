import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleUtilisateur } from '../../../generated/prisma/enums.js';

export class UtilisateurResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  nom!: string;

  @ApiProperty({ enum: RoleUtilisateur })
  role!: RoleUtilisateur;

  @ApiPropertyOptional({ type: String, nullable: true })
  username?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  email?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description:
      'Chemin de l’image de profil; utiliser GET /utilisateurs/{id}/profil.',
  })
  profil?: string | null;
}

export class UtilisateurReponseAvecMessageDto {
  @ApiProperty()
  message!: string;

  @ApiProperty({ type: UtilisateurResponseDto })
  utilisateur!: UtilisateurResponseDto;
}

export class MessageResponseDto {
  @ApiProperty()
  message!: string;
}
