import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { TypeMouvement } from '../../../../generated/prisma/enums.js';
import type { MouvementFacture } from '../../../../generated/prisma/client.js';
import type {
  ActeurFacture,
  FactureWorkflowLue,
} from '../globale/facture-globale.service.js';
import { FactureGlobaleService } from '../globale/facture-globale.service.js';
import {
  EnvoiValidationDto,
  ActionFactureDto,
  ModifierFactureGlobaleDto,
  ModifierMontantsFactureDto,
  RemarqueObligatoireDto,
  MotifObligatoireDto,
  RemarqueOptionnelleDto,
  SortieFactureDto,
  ValidationFactureDto,
  TYPES_ACTION_AVEC_DATE,
} from '../../dtos/facture-workflow.dto.js';
import { FactureRoleGuard } from '../../shared/facture-role.guard.js';
import { serialiserMontants } from '../../shared/serialiser-montants.js';

interface RequeteAvecUtilisateur {
  user?: ActeurFacture;
}

const VALIDATION_PAYLOAD = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

const PIPE_IDENTIFIANT = new ParseIntPipe({
  exceptionFactory: () =>
    new BadRequestException(
      "L'identifiant de la facture doit être un entier positif.",
    ),
});

export const VALIDATION_ACTION = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  exceptionFactory: (erreurs) => {
    const type = erreurs.find((erreur) => erreur.property === 'type')?.value;
    if (
      type === TypeMouvement.ENREGISTREMENT ||
      type === TypeMouvement.MODIFICATION
    ) {
      return new UnprocessableEntityException(
        'Les mouvements ENREGISTREMENT et MODIFICATION ne sont pas des actions.',
      );
    }
    return new BadRequestException(erreurs);
  },
});

@Controller('factures')
export class FactureWorkflowController {
  constructor(private readonly factureGlobaleService: FactureGlobaleService) {}

  @Post(':id/retour-prestataire')
  @ApiOperation({ deprecated: true })
  @HttpCode(HttpStatus.OK)
  @UseGuards(FactureRoleGuard)
  @UsePipes(VALIDATION_PAYLOAD)
  async retourPrestataire(
    @Param('id', PIPE_IDENTIFIANT) id: number,
    @Body() donnees: RemarqueObligatoireDto,
    @Req() requete: RequeteAvecUtilisateur,
  ) {
    const facture = await this.factureGlobaleService.retourPrestataire(
      id,
      this.obtenirActeur(requete),
      donnees,
    );
    return serialiserMontants({
      ...facture,
      message: 'La facture a été marquée comme retournée au prestataire.',
    });
  }

  @Post(':id/reception-apres-modification')
  @ApiOperation({ deprecated: true })
  @HttpCode(HttpStatus.OK)
  @UseGuards(FactureRoleGuard)
  @UsePipes(VALIDATION_PAYLOAD)
  async receptionApresModification(
    @Param('id', PIPE_IDENTIFIANT) id: number,
    @Body() donnees: RemarqueOptionnelleDto = new RemarqueOptionnelleDto(),
    @Req() requete: RequeteAvecUtilisateur,
  ) {
    const facture = await this.factureGlobaleService.receptionApresModification(
      id,
      this.obtenirActeur(requete),
      donnees,
    );
    return serialiserMontants({
      ...facture,
      message: 'La facture corrigée a été réceptionnée.',
    });
  }

  @Post(':id/envoi-validation')
  @ApiOperation({ deprecated: true })
  @HttpCode(HttpStatus.OK)
  @UseGuards(FactureRoleGuard)
  @UsePipes(VALIDATION_PAYLOAD)
  async envoyerValidation(
    @Param('id', PIPE_IDENTIFIANT) id: number,
    @Body() donnees: EnvoiValidationDto,
    @Req() requete: RequeteAvecUtilisateur,
  ) {
    const facture = await this.factureGlobaleService.envoyerValidation(
      id,
      this.obtenirActeur(requete),
      donnees,
    );
    return serialiserMontants({
      ...facture,
      message: 'La facture a été envoyée en validation.',
    });
  }

  @Post(':id/validation')
  @ApiOperation({ deprecated: true })
  @HttpCode(HttpStatus.OK)
  @UseGuards(FactureRoleGuard)
  @UsePipes(VALIDATION_PAYLOAD)
  async valider(
    @Param('id', PIPE_IDENTIFIANT) id: number,
    @Body() donnees: ValidationFactureDto = new ValidationFactureDto(),
    @Req() requete: RequeteAvecUtilisateur,
  ) {
    const facture = await this.factureGlobaleService.valider(
      id,
      this.obtenirActeur(requete),
      donnees,
    );
    return serialiserMontants({
      ...facture,
      message: 'La facture a été validée.',
    });
  }

  @Post(':id/retour-correction')
  @ApiOperation({ deprecated: true })
  @HttpCode(HttpStatus.OK)
  @UseGuards(FactureRoleGuard)
  @UsePipes(VALIDATION_PAYLOAD)
  async retournerCorrection(
    @Param('id', PIPE_IDENTIFIANT) id: number,
    @Body() donnees: RemarqueObligatoireDto,
    @Req() requete: RequeteAvecUtilisateur,
  ) {
    const facture = await this.factureGlobaleService.retournerCorrection(
      id,
      this.obtenirActeur(requete),
      donnees,
    );
    return serialiserMontants({
      ...facture,
      message: 'La facture a été retournée pour correction.',
    });
  }

  @Post(':id/sortie')
  @ApiOperation({ deprecated: true })
  @HttpCode(HttpStatus.OK)
  @UseGuards(FactureRoleGuard)
  @UsePipes(VALIDATION_PAYLOAD)
  async sortir(
    @Param('id', PIPE_IDENTIFIANT) id: number,
    @Body() donnees: SortieFactureDto,
    @Req() requete: RequeteAvecUtilisateur,
  ) {
    const facture = await this.factureGlobaleService.sortir(
      id,
      this.obtenirActeur(requete),
      donnees,
    );
    return serialiserMontants({
      ...facture,
      message: 'La facture a été marquée comme sortie.',
    });
  }

  @Post(':id/reouverture')
  @ApiOperation({ deprecated: true })
  @HttpCode(HttpStatus.OK)
  @UseGuards(FactureRoleGuard)
  @UsePipes(VALIDATION_PAYLOAD)
  async reouvrir(
    @Param('id', PIPE_IDENTIFIANT) id: number,
    @Body() donnees: MotifObligatoireDto,
    @Req() requete: RequeteAvecUtilisateur,
  ) {
    const facture = await this.factureGlobaleService.reouvrir(
      id,
      this.obtenirActeur(requete),
      donnees,
    );
    return serialiserMontants({
      ...facture,
      message: 'La facture a été rouverte pour revalidation.',
    });
  }

  @Post(':id/demande-suppression')
  @ApiOperation({ deprecated: true })
  @HttpCode(HttpStatus.OK)
  @UseGuards(FactureRoleGuard)
  @UsePipes(VALIDATION_PAYLOAD)
  async demanderSuppression(@Param('id', PIPE_IDENTIFIANT) id: number, @Body() donnees: MotifObligatoireDto, @Req() requete: RequeteAvecUtilisateur) {
    const facture = await this.factureGlobaleService.demanderSuppression(id, this.obtenirActeur(requete), donnees);
    return serialiserMontants({ ...facture, message: 'La suppression de la facture a été demandée.' });
  }

  @Post(':id/validation-suppression')
  @ApiOperation({ deprecated: true })
  @HttpCode(HttpStatus.OK)
  @UseGuards(FactureRoleGuard)
  @UsePipes(VALIDATION_PAYLOAD)
  async validerSuppression(@Param('id', PIPE_IDENTIFIANT) id: number, @Body() donnees: RemarqueOptionnelleDto = new RemarqueOptionnelleDto(), @Req() requete: RequeteAvecUtilisateur) {
    const facture = await this.factureGlobaleService.validerSuppression(id, this.obtenirActeur(requete), donnees);
    return serialiserMontants({ ...facture, message: 'La facture a été supprimée logiquement.' });
  }

  @Post(':id/refus-suppression')
  @ApiOperation({ deprecated: true })
  @HttpCode(HttpStatus.OK)
  @UseGuards(FactureRoleGuard)
  @UsePipes(VALIDATION_PAYLOAD)
  async refuserSuppression(@Param('id', PIPE_IDENTIFIANT) id: number, @Body() donnees: RemarqueOptionnelleDto = new RemarqueOptionnelleDto(), @Req() requete: RequeteAvecUtilisateur) {
    const facture = await this.factureGlobaleService.refuserSuppression(id, this.obtenirActeur(requete), donnees);
    return serialiserMontants({ ...facture, message: 'La demande de suppression a été refusée.' });
  }

  @Patch(':id/statut')
  @HttpCode(HttpStatus.OK)
  @UseGuards(FactureRoleGuard)
  @UsePipes(VALIDATION_ACTION)
  async modifierStatut(
    @Param('id', PIPE_IDENTIFIANT) id: number,
    @Body() donnees: ActionFactureDto,
    @Req() requete: RequeteAvecUtilisateur,
  ) {
    if (
      donnees.date !== undefined &&
      !TYPES_ACTION_AVEC_DATE.some((type) => type === donnees.type)
    ) {
      throw new BadRequestException(
        `La date ne peut pas être fournie pour l'action ${donnees.type}.`,
      );
    }
    if (
      donnees.destinataireId !== undefined &&
      donnees.type !== TypeMouvement.ENVOI_VALIDATION
    ) {
      throw new BadRequestException(
        'destinataireId est uniquement accepté pour ENVOI_VALIDATION.',
      );
    }
    if (
      donnees.service !== undefined &&
      donnees.type !== TypeMouvement.SORTIE
    ) {
      throw new BadRequestException(
        'service est uniquement accepté pour SORTIE.',
      );
    }
    const date = await this.factureGlobaleService.validerDateAction(
      id,
      donnees.date,
    );
    let mouvementCree: MouvementFacture | undefined;
    const options = {
      date,
      capturerMouvement: (mouvement: MouvementFacture) => {
        mouvementCree = mouvement;
      },
    };
    const acteur = this.obtenirActeur(requete);
    let facture: FactureWorkflowLue | undefined;
    switch (donnees.type) {
      case TypeMouvement.ENVOI_VALIDATION:
        facture = await this.factureGlobaleService.envoyerValidation(
          id,
          acteur,
          {
            destinataireId: this.obtenirDestinataireId(donnees),
            remarque: donnees.remarque,
          },
          options,
        );
        break;
      case TypeMouvement.RETOUR_POUR_CORRECTION:
        facture = await this.factureGlobaleService.retournerCorrection(
          id,
          acteur,
          { remarque: this.obtenirRemarqueObligatoire(donnees) },
          options,
        );
        break;
      case TypeMouvement.RETOUR_PRESTATAIRE:
        facture = await this.factureGlobaleService.retourPrestataire(
          id,
          acteur,
          { remarque: this.obtenirRemarqueObligatoire(donnees) },
          options,
        );
        break;
      case TypeMouvement.RECEPTION_APRES_MODIFICATION:
        facture = await this.factureGlobaleService.receptionApresModification(
          id,
          acteur,
          { remarque: donnees.remarque },
          options,
        );
        break;
      case TypeMouvement.VALIDATION:
        facture = await this.factureGlobaleService.valider(
          id,
          acteur,
          {
            remarque: donnees.remarque,
          },
          options,
        );
        break;
      case TypeMouvement.SORTIE:
        facture = await this.factureGlobaleService.sortir(
          id,
          acteur,
          { service: this.obtenirServiceSortie(donnees) },
          options,
        );
        break;
      case TypeMouvement.REOUVERTURE:
        facture = await this.factureGlobaleService.reouvrir(
          id,
          acteur,
          { motif: this.obtenirRemarqueObligatoire(donnees) },
          options,
        );
        break;
      case TypeMouvement.DEMANDE_SUPPRESSION:
        facture = await this.factureGlobaleService.demanderSuppression(
          id,
          acteur,
          { motif: this.obtenirRemarqueObligatoire(donnees) },
          options,
        );
        break;
      case TypeMouvement.REFUS_SUPPRESSION:
        facture = await this.factureGlobaleService.refuserSuppression(
          id,
          acteur,
          { remarque: donnees.remarque },
          options,
        );
        break;
      case TypeMouvement.SUPPRESSION:
        facture = await this.factureGlobaleService.validerSuppression(
          id,
          acteur,
          { remarque: donnees.remarque },
          options,
        );
        break;
    }
    if (facture === undefined || mouvementCree === undefined) {
      throw new InternalServerErrorException(
        "L'action a abouti sans retourner le mouvement créé.",
      );
    }
    return serialiserMontants({ ...facture, mouvement: mouvementCree });
  }

  @Patch(':id')
  @UseGuards(FactureRoleGuard)
  @UsePipes(VALIDATION_PAYLOAD)
  async modifierInformations(
    @Param('id', PIPE_IDENTIFIANT) id: number,
    @Body() donnees: ModifierFactureGlobaleDto,
    @Req() requete: RequeteAvecUtilisateur,
  ) {
    const facture = await this.factureGlobaleService.modifierInformations(
      id,
      this.obtenirActeur(requete),
      donnees,
    );
    return serialiserMontants({
      ...facture,
      message: 'Les informations de la facture ont été modifiées.',
    });
  }

  @Patch(':id/montants')
  @UseGuards(FactureRoleGuard)
  @UsePipes(VALIDATION_PAYLOAD)
  async modifierMontants(
    @Param('id', PIPE_IDENTIFIANT) id: number,
    @Body() donnees: ModifierMontantsFactureDto,
    @Req() requete: RequeteAvecUtilisateur,
  ) {
    const facture = await this.factureGlobaleService.modifierMontants(
      id,
      this.obtenirActeur(requete),
      donnees,
    );
    return serialiserMontants({
      ...facture,
      message: 'Les montants de la facture ont été modifiés.',
    });
  }

  private obtenirActeur(requete: RequeteAvecUtilisateur): ActeurFacture {
    const acteur = requete.user;
    if (acteur === undefined) {
      throw new BadRequestException(
        "Le guard n'a pas fourni l'utilisateur de l'action.",
      );
    }
    return acteur;
  }

  private obtenirRemarqueObligatoire(donnees: ActionFactureDto): string {
    if (donnees.remarque === undefined) {
      throw new BadRequestException('La remarque est obligatoire.');
    }
    return donnees.remarque;
  }

  private obtenirDestinataireId(donnees: ActionFactureDto): number {
    if (donnees.destinataireId === undefined) {
      throw new BadRequestException('Le destinataire est obligatoire.');
    }
    return donnees.destinataireId;
  }

  private obtenirServiceSortie(
    donnees: ActionFactureDto,
  ): NonNullable<ActionFactureDto['service']> {
    if (donnees.service === undefined) {
      throw new BadRequestException('Le service est obligatoire pour SORTIE.');
    }
    return donnees.service;
  }
}
