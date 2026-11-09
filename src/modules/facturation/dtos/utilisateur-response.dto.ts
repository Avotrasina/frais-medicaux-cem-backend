import { ApiProperty } from '@nestjs/swagger';
import { RoleUtilisateur } from '../../../generated/prisma/enums.js';

export class UtilisateurResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  nom!: string;

  @ApiProperty({ enum: RoleUtilisateur })
  role!: RoleUtilisateur;
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
