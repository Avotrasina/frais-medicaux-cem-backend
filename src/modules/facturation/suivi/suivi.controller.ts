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
  Query,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import type { ActeurFacture } from '../factures/globale/facture-globale.service.js';
import { CreerLigneSuiviDto, ModifierLigneSuiviDto } from '../dtos/suivi.dto.js';
import { SuiviService } from './suivi.service.js';

interface RequeteAvecUtilisateur {
  user?: ActeurFacture;
}
const PIPE = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@Controller()
export class SuiviController {
  constructor(private readonly suivi: SuiviService) {}

  @Post('factures/:id/suivis')
  @UsePipes(PIPE)
  async creer(
    @Param('id', ParseIntPipe) id: number,
    @Body() donnees: CreerLigneSuiviDto,
    @Req() requete: RequeteAvecUtilisateur,
  ) {
    return this.suivi.creer(id, this.acteur(requete), donnees);
  }

  @Get('suivis/cibles')
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    example: '2026-11-06',
    description:
      'Date de référence AAAA-MM-JJ. Par défaut : aujourd’hui, fuseau Indian/Antananarivo.',
  })
  async listerCibles(@Query('date') date?: string) {
    return this.suivi.listerCibles(date);
  }

  @Get('suivis')
  @ApiQuery({
    name: 'historique',
    required: false,
    type: Boolean,
    example: false,
    description: 'Expose les dates et versions historiques des plafonds.',
  })
  async lire(
    @Query('idp') idp: string,
    @Query('acteId') acteIdTexte: string,
    @Query('annee') anneeTexte?: string,
    @Query('factureId') factureIdTexte?: string,
    @Query('historique') historiqueTexte?: string,
  ) {
    if (idp === undefined || idp.trim() === '')
      throw new BadRequestException('L’IDP est obligatoire.');
    const acteId = this.entier(acteIdTexte, 'L’acte');
    const annee =
      anneeTexte === undefined
        ? new Date().getUTCFullYear()
        : this.entier(anneeTexte, 'L’année');
    const factureId =
      factureIdTexte === undefined
        ? undefined
        : this.entier(factureIdTexte, 'La facture');
    const historique =
      historiqueTexte === undefined
        ? false
        : historiqueTexte === 'true'
          ? true
          : historiqueTexte === 'false'
            ? false
            : null;
    if (historique === null)
      throw new BadRequestException(
        'Le paramètre historique doit être true ou false.',
      );
    return this.suivi.lire(idp, acteId, annee, factureId, historique);
  }

  @Patch('suivis/lignes/:ligneId')
  @UsePipes(PIPE)
  async modifier(
    @Param('ligneId', ParseIntPipe) ligneId: number,
    @Body() donnees: ModifierLigneSuiviDto,
    @Req() requete: RequeteAvecUtilisateur,
  ) {
    return this.suivi.modifier(ligneId, this.acteur(requete), donnees);
  }

  @Delete('suivis/lignes/:ligneId')
  @HttpCode(HttpStatus.OK)
  async supprimer(
    @Param('ligneId', ParseIntPipe) ligneId: number,
    @Req() requete: RequeteAvecUtilisateur,
  ) {
    return this.suivi.supprimer(ligneId, this.acteur(requete));
  }

  private acteur(requete: RequeteAvecUtilisateur): ActeurFacture {
    if (requete.user === undefined)
      throw new BadRequestException(
        'Aucun utilisateur authentifié n’est disponible.',
      );
    return requete.user;
  }

  private entier(valeur: string | undefined, nom: string): number {
    const nombre = Number(valeur);
    if (!Number.isSafeInteger(nombre) || nombre <= 0)
      throw new BadRequestException(`${nom} doit être un entier positif.`);
    return nombre;
  }
}
