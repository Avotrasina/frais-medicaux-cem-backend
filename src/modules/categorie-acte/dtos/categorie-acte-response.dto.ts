import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ModeleSuivi } from '../../facturation/suivi/suivi-modele.js';
import { ActeAvecPlafondsResponseDto } from '../../acte/dtos/acte-response.dto.js';
import type { ReadCategorieActe } from '../types/categorie-acte.types.js';
import {
  PlafondResoluResponseDto,
  VersionPlafondResponseDto,
} from '../../plafond/dtos/plafond-resolution-response.dto.js';

class PlafondsCategorieResponseDto {
  @ApiProperty({ type: PlafondResoluResponseDto, nullable: true })
  parActe!: PlafondResoluResponseDto | null;

  @ApiProperty({ type: PlafondResoluResponseDto, nullable: true })
  parAn!: PlafondResoluResponseDto | null;

  @ApiPropertyOptional({ type: [VersionPlafondResponseDto] })
  historique?: VersionPlafondResponseDto[];
}

export class CategorieActeResponseDto implements ReadCategorieActe {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  nomCategorie!: string;
}

export class CategorieActeAvecPlafondsResponseDto extends CategorieActeResponseDto {
  @ApiProperty({ type: PlafondsCategorieResponseDto })
  plafonds!: PlafondsCategorieResponseDto;

  @ApiProperty({
    enum: ['PLAFOND_ANNUEL', 'SEANCES', 'PLAFOND_ACTE_ET_ANNUEL'],
    nullable: true,
  })
  modeleSuivi!: ModeleSuivi | null;
}

export class CategorieActeAvecActesResponseDto extends CategorieActeResponseDto {
  @ApiProperty({ type: [ActeAvecPlafondsResponseDto] })
  actes!: ActeAvecPlafondsResponseDto[];
}

export class CategorieActeAvecPlafondsEtActesResponseDto extends CategorieActeAvecPlafondsResponseDto {
  @ApiProperty({ type: [ActeAvecPlafondsResponseDto] })
  actes!: ActeAvecPlafondsResponseDto[];
}
