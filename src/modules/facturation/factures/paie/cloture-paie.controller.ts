import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { CloturerPaieDto } from '../../dtos/cloture-paie.dto.js';
import {
  CloturePaieResponseDto,
  RefusClotureResponseDto,
} from '../../dtos/paie-response.dto.js';
import { obtenirUtilisateurId } from '../../shared/utilisateur-facture.js';
import type { RequeteAvecUtilisateur } from '../../shared/utilisateur-facture.js';
import { CloturePaieService } from './cloture-paie.service.js';

const VALIDATION_PAYLOAD = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@ApiTags('Paies')
@Controller('paies')
@ApiExtraModels(RefusClotureResponseDto)
export class CloturePaieController {
  constructor(private readonly cloturePaie: CloturePaieService) {}

  @Post(':mois/cloture')
  @UsePipes(VALIDATION_PAYLOAD)
  @ApiOperation({
    summary: 'Clôturer plusieurs factures pour un mois de paie',
    description:
      'Vérifie le rapprochement de toutes les factures puis affecte le mois de paie, clôture les factures et leurs lignes.',
  })
  @ApiParam({
    name: 'mois',
    example: '2026-03',
    description: 'Mois au format AAAA-MM',
  })
  @ApiCreatedResponse({
    type: CloturePaieResponseDto,
    description: 'Factures clôturées.',
  })
  @ApiResponse({
    status: 400,
    description: 'Mois ou corps de requête invalide.',
  })
  @ApiResponse({
    status: 409,
    description: 'Une ou plusieurs factures ne peuvent pas être clôturées.',
    schema: {
      anyOf: [
        {
          type: 'array',
          items: { $ref: getSchemaPath(RefusClotureResponseDto) },
        },
        {
          type: 'object',
          required: ['statusCode', 'message', 'error'],
          properties: {
            statusCode: { type: 'number', example: 409 },
            message: { type: 'string' },
            error: { type: 'string', example: 'Conflict' },
          },
        },
      ],
    },
  })
  cloturer(
    @Param('mois') mois: string,
    @Body() donnees: CloturerPaieDto,
    @Req() requete: RequeteAvecUtilisateur,
  ): Promise<CloturePaieResponseDto> {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mois) || mois.startsWith('0000-')) {
      throw new BadRequestException('Le mois doit être au format AAAA-MM.');
    }
    return this.cloturePaie.cloturer(
      mois,
      donnees.dateCloture,
      donnees.factureIds,
      obtenirUtilisateurId(requete),
    );
  }
}
