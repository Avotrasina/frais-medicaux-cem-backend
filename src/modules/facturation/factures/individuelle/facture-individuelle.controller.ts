import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { ActeurFacture } from '../globale/facture-globale.service.js';
import { FactureRoleGuard } from '../../shared/facture-role.guard.js';
import {
  AffecterRetenueDto,
  CreerFactureIndividuelleDto,
  ModifierFactureIndividuelleDto,
  PropositionDepassementDto,
} from '../../dtos/facture-individuelle.dto.js';
import { FactureIndividuelleService } from './facture-individuelle.service.js';

interface RequeteAvecUtilisateur {
  user?: ActeurFacture;
}

const VALIDATION_PAYLOAD = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@ApiTags('Factures individuelles')
@Controller('factures')
@UseGuards(FactureRoleGuard)
export class FactureIndividuelleController {
  constructor(private readonly lignes: FactureIndividuelleService) {}

  @Post(':id/lignes')
  @ApiOperation({
    summary: 'Créer une ligne de facture individuelle',
    description: 'Ajoute une ligne de prestation à une facture et calcule les parts prises en charge.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant de la facture globale' })
  @UsePipes(VALIDATION_PAYLOAD)
  creer(
    @Param('id', ParseIntPipe) id: number,
    @Body() donnees: CreerFactureIndividuelleDto,
    @Req() requete: RequeteAvecUtilisateur,
  ) {
    return this.lignes.creer(id, this.obtenirActeur(requete), donnees);
  }

  @Put(':id/lignes/:ligneId')
  @ApiOperation({
    summary: 'Modifier une ligne de facture individuelle',
    description: 'Met à jour une prestation et recalcule ses montants.',
  })
  @UsePipes(VALIDATION_PAYLOAD)
  modifier(
    @Param('id', ParseIntPipe) id: number,
    @Param('ligneId', ParseIntPipe) ligneId: number,
    @Body() donnees: ModifierFactureIndividuelleDto,
    @Req() requete: RequeteAvecUtilisateur,
  ) {
    return this.lignes.modifier(
      id,
      ligneId,
      this.obtenirActeur(requete),
      donnees,
    );
  }

  @Delete(':id/lignes/:ligneId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer physiquement une ligne de facture individuelle',
    description: 'Supprime une ligne de prestation de la facture.',
  })
  supprimer(
    @Param('id', ParseIntPipe) id: number,
    @Param('ligneId', ParseIntPipe) ligneId: number,
    @Req() requete: RequeteAvecUtilisateur,
  ) {
    return this.lignes.supprimer(id, ligneId, this.obtenirActeur(requete));
  }

  @Get(':id/lignes/proposition')
  @ApiOperation({
    summary: 'Lire les dépassements T5_x correspondant à une ligne',
    description: 'Propose les montants de dépassement calculés depuis le suivi associé.',
  })
  @ApiQuery({ name: 'idp', required: true })
  @ApiQuery({ name: 'acteId', required: true, type: Number })
  @ApiQuery({ name: 'dateActe', required: true, example: '2026-01-15' })
  @UsePipes(VALIDATION_PAYLOAD)
  proposer(
    @Param('id', ParseIntPipe) id: number,
    @Query() donnees: PropositionDepassementDto,
  ) {
    return this.lignes.proposer(id, donnees);
  }

  @Get(':id/lignes')
  @ApiOperation({
    summary: 'Lister les lignes et leurs totaux calculés',
    description: 'Retourne les prestations enregistrées et leurs cumuls pour la facture.',
  })
  lister(@Param('id', ParseIntPipe) id: number) {
    return this.lignes.lister(id);
  }

  @Patch(':id/retenue')
  @ApiOperation({
    summary: 'Affecter une retenue sur salaire à plusieurs lignes',
    description: 'Associe des lignes à une référence de paie et à un mois d’affectation.',
  })
  @UsePipes(VALIDATION_PAYLOAD)
  affecterRetenue(
    @Param('id', ParseIntPipe) id: number,
    @Body() donnees: AffecterRetenueDto,
    @Req() requete: RequeteAvecUtilisateur,
  ) {
    return this.lignes.affecterRetenue(
      id,
      this.obtenirActeur(requete),
      donnees,
    );
  }

  @Get(':id/controle-totaux')
  @ApiOperation({
    summary: 'Comparer les sommes des lignes aux montants de la facture',
    description: 'Retourne les écarts entre les lignes détaillées et les montants globaux saisis.',
  })
  controleTotaux(@Param('id', ParseIntPipe) id: number) {
    return this.lignes.controleTotaux(id);
  }

  private obtenirActeur(requete: RequeteAvecUtilisateur): ActeurFacture {
    if (requete.user === undefined) {
      throw new BadRequestException(
        "Le guard n'a pas fourni l'utilisateur de l'action.",
      );
    }
    return requete.user;
  }
}
