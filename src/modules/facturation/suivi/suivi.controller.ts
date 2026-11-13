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
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import type { ActeurFacture } from '../factures/globale/facture-globale.service.js';
import {
  CreerLigneSuiviDto,
  ModifierLigneSuiviDto,
} from '../dtos/suivi.dto.js';
import { SuiviService } from './suivi.service.js';
import type { FeuilleSuivi } from './suivi.service.js';
import { FactureRoleGuard } from '../shared/facture-role.guard.js';
import {
  CibleSuiviResponseDto,
  FeuilleSuiviCompacteResponseDto,
  FeuilleSuiviModifieeResponseDto,
  FeuilleSuiviResponseDto,
} from '../dtos/suivi-response.dto.js';

interface RequeteAvecUtilisateur {
  user?: ActeurFacture;
}
const PIPE = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@Controller()
@ApiExtraModels(
  CibleSuiviResponseDto,
  FeuilleSuiviCompacteResponseDto,
  FeuilleSuiviResponseDto,
  FeuilleSuiviModifieeResponseDto,
)
export class SuiviController {
  constructor(private readonly suivi: SuiviService) {}

  @Post('factures/:id/suivis')
  @UseGuards(FactureRoleGuard)
  @ApiCreatedResponse({ type: FeuilleSuiviCompacteResponseDto })
  @ApiOperation({
    summary: 'Ajouter une ligne de suivi',
    description:
      'Enregistre un acte nécessitant un suivi de plafond pour une facture. L’observation est facultative.',
  })
  @UsePipes(PIPE)
  async creer(
    @Param('id', ParseIntPipe) id: number,
    @Body() donnees: CreerLigneSuiviDto,
    @Req() requete: RequeteAvecUtilisateur,
  ): Promise<FeuilleSuiviCompacteResponseDto> {
    const feuille = await this.suivi.creer(id, this.acteur(requete), donnees);
    return this.reponseCompacte(feuille);
  }

  @Get('suivis/cibles')
  @ApiOkResponse({ type: CibleSuiviResponseDto, isArray: true })
  @ApiOperation({
    summary: 'Lister les cibles de suivi',
    description:
      'Retourne les actes et catégories dont les plafonds doivent être suivis à la date demandée.',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    example: '2026-11-06',
    description:
      'Date de référence AAAA-MM-JJ. Par défaut : aujourd’hui, fuseau Indian/Antananarivo.',
  })
  async listerCibles(
    @Query('date') date?: string,
  ): Promise<CibleSuiviResponseDto[]> {
    return this.suivi.listerCibles(date);
  }

  @Get('suivis')
  @ApiOkResponse({ type: FeuilleSuiviCompacteResponseDto })
  @ApiOperation({
    summary: 'Consulter une feuille de suivi',
    description:
      'Retourne le cumul, les dépassements et les plafonds applicables à un bénéficiaire et un acte.',
  })
  @ApiQuery({
    name: 'historique',
    required: false,
    type: Boolean,
    example: false,
    description: 'Expose les dates et versions historiques des plafonds.',
  })
  @ApiQuery({
    name: 'acteId',
    required: false,
    type: Number,
    description: 'Cible acte; à fournir à la place de categorieActeId.',
  })
  @ApiQuery({
    name: 'categorieActeId',
    required: false,
    type: Number,
    description: 'Cible catégorie; à fournir à la place de acteId.',
  })
  async lire(
    @Query('idp') idp: string,
    @Query('acteId') acteIdTexte?: string,
    @Query('categorieActeId') categorieActeIdTexte?: string,
    @Query('annee') anneeTexte?: string,
    @Query('factureId') factureIdTexte?: string,
    @Query('historique') historiqueTexte?: string,
  ): Promise<FeuilleSuiviCompacteResponseDto> {
    if (idp === undefined || idp.trim() === '')
      throw new BadRequestException('L’IDP est obligatoire.');
    if ((acteIdTexte === undefined) === (categorieActeIdTexte === undefined))
      throw new BadRequestException(
        'Fournissez exactement un paramètre parmi acteId et categorieActeId.',
      );
    const acteId =
      acteIdTexte === undefined
        ? undefined
        : this.entier(acteIdTexte, 'L’acte');
    const categorieActeId =
      categorieActeIdTexte === undefined
        ? undefined
        : this.entier(categorieActeIdTexte, 'La catégorie');
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
    const feuille =
      acteId === undefined
        ? await this.suivi.lireCategorie(
            idp,
            categorieActeId!,
            annee,
            factureId,
            historique,
          )
        : await this.suivi.lire(idp, acteId, annee, factureId, historique);
    return this.reponseCompacte(feuille);
  }

  @Patch('suivis/lignes/:ligneId')
  @UseGuards(FactureRoleGuard)
  @ApiOkResponse({
    schema: {
      oneOf: [
        { $ref: '#/components/schemas/FeuilleSuiviResponseDto' },
        { $ref: '#/components/schemas/FeuilleSuiviModifieeResponseDto' },
      ],
    },
  })
  @ApiOperation({
    summary: 'Modifier une ligne de suivi',
    description:
      'Met à jour le montant, la date ou l’observation d’un acte suivi et recalcule les cumuls.',
  })
  @UsePipes(PIPE)
  async modifier(
    @Param('ligneId', ParseIntPipe) ligneId: number,
    @Body() donnees: ModifierLigneSuiviDto,
    @Req() requete: RequeteAvecUtilisateur,
  ): Promise<FeuilleSuiviResponseDto | FeuilleSuiviModifieeResponseDto> {
    return this.suivi.modifier(ligneId, this.acteur(requete), donnees);
  }

  @Delete('suivis/lignes/:ligneId')
  @UseGuards(FactureRoleGuard)
  @ApiOperation({
    summary: 'Supprimer une ligne de suivi',
    description: 'Retire un acte suivi et recalcule les cumuls associés.',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: FeuilleSuiviResponseDto })
  async supprimer(
    @Param('ligneId', ParseIntPipe) ligneId: number,
    @Req() requete: RequeteAvecUtilisateur,
  ): Promise<FeuilleSuiviResponseDto> {
    return this.suivi.supprimer(ligneId, this.acteur(requete));
  }

  private acteur(requete: RequeteAvecUtilisateur): ActeurFacture {
    if (requete.user === undefined)
      throw new BadRequestException(
        'Aucun utilisateur authentifié n’est disponible.',
      );
    return requete.user;
  }

  private reponseCompacte(
    feuille: FeuilleSuivi,
  ): FeuilleSuiviCompacteResponseDto {
    return {
      modele: feuille.modele,
      annee: feuille.annee,
      lignes: feuille.lignes,
      totaux: feuille.totaux,
    };
  }

  private entier(valeur: string | undefined, nom: string): number {
    const nombre = Number(valeur);
    if (!Number.isSafeInteger(nombre) || nombre <= 0)
      throw new BadRequestException(`${nom} doit être un entier positif.`);
    return nombre;
  }
}
