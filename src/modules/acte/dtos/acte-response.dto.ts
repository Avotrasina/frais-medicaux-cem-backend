import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ModeleSuivi } from '../../facturation/suivi/suivi-modele.js';
import type { ReadActe } from '../types/acte.types.js';
import { RegimeActe } from '../../../generated/prisma/enums.js';
import {
  PlafondResoluResponseDto,
  VersionPlafondResponseDto,
} from '../../plafond/dtos/plafond-resolution-response.dto.js';

class PlafondsActeResponseDto {
  @ApiProperty({ type: PlafondResoluResponseDto, nullable: true })
  parActe!: PlafondResoluResponseDto | null;

  @ApiProperty({ type: PlafondResoluResponseDto, nullable: true })
  parAn!: PlafondResoluResponseDto | null;

  @ApiPropertyOptional({ type: [VersionPlafondResponseDto] })
  historique?: VersionPlafondResponseDto[];
}

export class ActeResponseDto implements ReadActe {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  nomActe!: string;

  @ApiProperty()
  listeLibelle!: string;

  @ApiProperty({ enum: RegimeActe })
  regime!: RegimeActe;

  @ApiProperty()
  categorieActeId!: number;
}

export class ActeAvecPlafondsResponseDto extends ActeResponseDto {
  @ApiProperty({ type: PlafondsActeResponseDto })
  plafonds!: PlafondsActeResponseDto;

  @ApiProperty({
    enum: ['PLAFOND_ANNUEL', 'SEANCES', 'PLAFOND_ACTE_ET_ANNUEL'],
    nullable: true,
  })
  modeleSuivi!: ModeleSuivi | null;
}
