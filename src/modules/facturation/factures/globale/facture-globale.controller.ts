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
import { ApiOperation } from '@nestjs/swagger';
import { CreerFactureGlobaleDto } from '../../dtos/creer-facture-globale.dto.js';
import { FactureGlobaleService } from './facture-globale.service.js';
import type { FactureGlobaleCreee } from './facture-globale.service.js';
import {
  MontantsSerialises,
  serialiserMontants,
} from '../../shared/serialiser-montants.js';
import { StatutFacture, TypeMouvement } from '../../../../generated/prisma/enums.js';
import { obtenirUtilisateurId } from '../../shared/utilisateur-facture.js';
import type { RequeteAvecUtilisateur } from '../../shared/utilisateur-facture.js';

@Controller('factures')
export class FactureGlobaleController {
  constructor(private readonly factureGlobaleService: FactureGlobaleService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les factures',
    description: 'Retourne les factures, avec un filtrage optionnel par statut.',
  })
  async lister(@Query('statut') statut?: string) {
    return serialiserMontants(
      await this.factureGlobaleService.lister(this.validerStatut(statut)),
    );
  }

  @Get(':id/mouvements')
  @ApiOperation({
    summary: 'Lister les mouvements d’une facture',
    description: 'Retourne l’historique des actions de la facture, filtrable par type de mouvement.',
  })
  async mouvements(
    @Param('id', ParseIntPipe) id: number,
    @Query('type') type?: TypeMouvement,
  ) {
    return this.factureGlobaleService.historique(id, this.validerTypeMouvement(type));
  }

  @Get(':id/transitions')
  @ApiOperation({
    summary: 'Lister les actions disponibles',
    description: 'Retourne les actions autorisées selon le statut courant de la facture et le rôle de l’utilisateur.',
  })
  async transitions(@Param('id', ParseIntPipe) id: number) {
    return this.factureGlobaleService.transitions(id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consulter une facture',
    description: 'Retourne le détail d’une facture globale.',
  })
  async obtenir(@Param('id', ParseIntPipe) id: number) {
    return serialiserMontants(await this.factureGlobaleService.obtenir(id));
  }

  @Post()
  @ApiOperation({
    summary: 'Créer une facture',
    description: 'Enregistre une facture globale et génère sa référence sociale.',
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
  ): Promise<MontantsSerialises<FactureGlobaleCreee>> {
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
}
