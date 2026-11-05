import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreerFactureGlobaleDto } from '../../dtos/creer-facture-globale.dto.js';
import { FactureGlobaleService } from './facture-globale.service.js';
import type { FactureGlobaleCreee } from './facture-globale.service.js';
import {
  MontantsSerialises,
  serialiserMontants,
} from '../../shared/serialiser-montants.js';
import { StatutFacture } from '../../../../generated/prisma/enums.js';

interface RequeteAvecUtilisateur {
  user?: { id: number };
}

function obtenirUtilisateurId(requete: RequeteAvecUtilisateur): number {
  const utilisateurId = requete.user?.id;
  if (utilisateurId !== undefined && Number.isInteger(utilisateurId)) {
    return utilisateurId;
  }

  const utilisateurTestId = process.env.FACTURATION_UTILISATEUR_TEST_ID;
  if (process.env.NODE_ENV === 'development' && utilisateurTestId !== undefined) {
    if (!/^[1-9]\d*$/.test(utilisateurTestId)) {
      throw new UnauthorizedException(
        'FACTURATION_UTILISATEUR_TEST_ID doit être un identifiant entier positif.',
      );
    }

    const identifiant = Number(utilisateurTestId);
    if (Number.isSafeInteger(identifiant)) {
      return identifiant;
    }
  }

  throw new UnauthorizedException(
    'Aucun utilisateur authentifié n’est disponible. En développement, définissez FACTURATION_UTILISATEUR_TEST_ID avec l’identifiant d’un utilisateur existant.',
  );
}

@Controller('factures')
export class FactureGlobaleController {
  constructor(private readonly factureGlobaleService: FactureGlobaleService) {}

  @Get()
  async lister(@Query('statut') statut?: StatutFacture) {
    return serialiserMontants(await this.factureGlobaleService.lister(statut));
  }

  @Get(':id/historique')
  async historique(@Param('id', ParseIntPipe) id: number) {
    return this.factureGlobaleService.historique(id);
  }

  @Get(':id')
  async obtenir(@Param('id', ParseIntPipe) id: number) {
    return serialiserMontants(await this.factureGlobaleService.obtenir(id));
  }

  @Post()
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
}
