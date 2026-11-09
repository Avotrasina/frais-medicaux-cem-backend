import {
  Body,
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CreerFactureGlobaleDto } from '../../dtos/creer-facture-globale.dto.js';
import { FactureGlobaleService } from './facture-globale.service.js';
import { serialiserMontants } from '../../shared/serialiser-montants.js';
import {
  StatutFacture,
  TypeMouvement,
} from '../../../../generated/prisma/enums.js';
import { obtenirUtilisateurId } from '../../shared/utilisateur-facture.js';
import type { RequeteAvecUtilisateur } from '../../shared/utilisateur-facture.js';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  FactureGlobaleCreeeResponseDto,
  FactureGlobaleDetailResponseDto,
  FactureGlobaleListeeResponseDto,
  MouvementFactureResponseDto,
  TransitionFactureResponseDto,
} from '../../dtos/facture-response.dto.js';
import type { StatutRapprochementFacture } from '../individuelle/facture-individuelle.service.js';

@Controller('factures')
@ApiExtraModels(
  FactureGlobaleListeeResponseDto,
  FactureGlobaleDetailResponseDto,
  FactureGlobaleCreeeResponseDto,
  MouvementFactureResponseDto,
  TransitionFactureResponseDto,
)
export class FactureGlobaleController {
  constructor(private readonly factureGlobaleService: FactureGlobaleService) {}

  @Get()
  @ApiOkResponse({ type: FactureGlobaleListeeResponseDto, isArray: true })
  @ApiOperation({
    summary: 'Lister les factures',
    description:
      'Retourne les factures, filtrables par statut, clôture et rapprochement.',
  })
  @ApiQuery({ name: 'cloturee', required: false, enum: ['true', 'false'] })
  @ApiQuery({
    name: 'rapprochement',
    required: false,
    enum: ['CONFORME', 'ECART', 'INCOMPLET'],
  })
  async lister(
    @Query('statut') statut?: string,
    @Query('cloturee') cloturee?: string,
    @Query('rapprochement') rapprochement?: string,
  ) : Promise<FactureGlobaleListeeResponseDto[]> {
    return serialiserMontants(
      await this.factureGlobaleService.lister(
        this.validerStatut(statut),
        this.validerCloturee(cloturee),
        this.validerRapprochement(rapprochement),
      ),
    );
  }

  @Get(':id/mouvements')
  @ApiOkResponse({ type: MouvementFactureResponseDto, isArray: true })
  @ApiOperation({
    summary: 'Lister les mouvements d’une facture',
    description:
      'Retourne l’historique des actions de la facture, filtrable par type de mouvement.',
  })
  async mouvements(
    @Param('id', ParseIntPipe) id: number,
    @Query('type') type?: TypeMouvement,
  ): Promise<MouvementFactureResponseDto[]> {
    return this.factureGlobaleService.historique(
      id,
      this.validerTypeMouvement(type),
    );
  }

  @Get(':id/transitions')
  @ApiOkResponse({ type: TransitionFactureResponseDto, isArray: true })
  @ApiOperation({
    summary: 'Lister les actions disponibles',
    description:
      'Retourne les actions autorisées selon le statut courant de la facture et le rôle de l’utilisateur.',
  })
  async transitions(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TransitionFactureResponseDto[]> {
    return this.factureGlobaleService.transitions(id);
  }

  @Get(':id')
  @ApiOkResponse({ type: FactureGlobaleDetailResponseDto })
  @ApiOperation({
    summary: 'Consulter une facture',
    description: 'Retourne le détail d’une facture globale.',
  })
  async obtenir(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<FactureGlobaleDetailResponseDto> {
    return serialiserMontants(await this.factureGlobaleService.obtenir(id));
  }

  @Post()
  @ApiCreatedResponse({ type: FactureGlobaleCreeeResponseDto })
  @ApiOperation({
    summary: 'Créer une facture',
    description:
      'Enregistre une facture globale et génère sa référence sociale.',
  })
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async creer(
    @Body() donnees: CreerFactureGlobaleDto,
    @Req() requete: RequeteAvecUtilisateur,
  ): Promise<FactureGlobaleCreeeResponseDto> {
    const utilisateurId = obtenirUtilisateurId(requete);

    const facture = await this.factureGlobaleService.creer(
      donnees,
      utilisateurId,
    );
    return serialiserMontants(facture);
  }

  private validerTypeMouvement(
    type?: TypeMouvement,
  ): TypeMouvement | undefined {
    if (type === undefined) return undefined;
    if (Object.values(TypeMouvement).includes(type)) return type;
    throw new BadRequestException('Le type de mouvement est invalide.');
  }

  private validerStatut(statut?: string): StatutFacture | undefined {
    if (statut === undefined) return undefined;
    if (Object.values(StatutFacture).includes(statut as StatutFacture)) {
      return statut as StatutFacture;
    }
    throw new BadRequestException(
      `Le statut est invalide. Valeurs acceptées : ${Object.values(StatutFacture).join(', ')}.`,
    );
  }

  private validerCloturee(cloturee?: string): boolean | undefined {
    if (cloturee === undefined) return undefined;
    if (cloturee === 'true') return true;
    if (cloturee === 'false') return false;
    throw new BadRequestException(
      'Le filtre cloturee doit être true ou false.',
    );
  }

  private validerRapprochement(
    rapprochement?: string,
  ): StatutRapprochementFacture | undefined {
    if (rapprochement === undefined) return undefined;
    if (
      rapprochement === 'CONFORME' ||
      rapprochement === 'ECART' ||
      rapprochement === 'INCOMPLET'
    ) {
      return rapprochement;
    }
    throw new BadRequestException(
      'Le filtre rapprochement doit être CONFORME, ECART ou INCOMPLET.',
    );
  }
}
