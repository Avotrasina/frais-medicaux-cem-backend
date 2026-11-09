import { ApiProperty } from '@nestjs/swagger';
import type { PieceJointeFactureVue } from '../pieces-jointes/piece-jointe-facture.service.js';

class AuteurPieceJointeResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  nom!: string;
}

export class PieceJointeFactureResponseDto implements PieceJointeFactureVue {
  @ApiProperty()
  id!: number;

  @ApiProperty({ type: String, nullable: true })
  nomFichier!: string | null;

  @ApiProperty()
  typeFichier!: string;

  @ApiProperty()
  tailleOctets!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: AuteurPieceJointeResponseDto, nullable: true })
  ajoutePar!: AuteurPieceJointeResponseDto | null;
}
