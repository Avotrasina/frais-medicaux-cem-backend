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
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { TypeMouvement } from '../../../../generated/prisma/enums.js';
import type { MouvementFacture } from '../../../../generated/prisma/client.js';
import type {
  ActeurFacture,
  FactureWorkflowLue,
} from '../globale/facture-globale.service.js';
import { FactureGlobaleService } from '../globale/facture-globale.service.js';
import {
  ActionFactureDto,
  ModifierFactureGlobaleDto,
  TYPES_ACTION_AVEC_DATE,
} from '../../dtos/facture-workflow.dto.js';
import { FactureRoleGuard } from '../../shared/facture-role.guard.js';
import { serialiserMontants } from '../../shared/serialiser-montants.js';
import {
  FactureGlobaleModificationResponseDto,
  FactureWorkflowResponseDto,
} from '../../dtos/facture-response.dto.js';

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
@ApiExtraModels(
  FactureWorkflowResponseDto,
  FactureGlobaleModificationResponseDto,
)
export class FactureWorkflowController {
  constructor(private readonly factureGlobaleService: FactureGlobaleService) {}

  @Patch(':id/statut')
  @ApiOkResponse({ type: FactureWorkflowResponseDto })
  @ApiOperation({
    summary: 'Exécuter une action sur une facture',
    description:
      'Applique une action métier autorisée et retourne la facture ainsi que le mouvement créé.',
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(FactureRoleGuard)
  @UsePipes(VALIDATION_ACTION)
  async modifierStatut(
    @Param('id', PIPE_IDENTIFIANT) id: number,
    @Body() donnees: ActionFactureDto,
    @Req() requete: RequeteAvecUtilisateur,
  ): Promise<FactureWorkflowResponseDto> {
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
  @ApiOkResponse({ type: FactureGlobaleModificationResponseDto })
  @ApiOperation({
    summary: 'Modifier une facture',
    description:
      'Modifie les informations générales et les montants, puis replace la facture au statut ENREGISTREE.',
  })
  @UseGuards(FactureRoleGuard)
  @UsePipes(VALIDATION_PAYLOAD)
  async modifierInformations(
    @Param('id', PIPE_IDENTIFIANT) id: number,
    @Body() donnees: ModifierFactureGlobaleDto,
    @Req() requete: RequeteAvecUtilisateur,
  ): Promise<FactureGlobaleModificationResponseDto> {
    const facture = await this.factureGlobaleService.modifierInformations(
      id,
      this.obtenirActeur(requete),
      donnees,
    );
    return serialiserMontants({
      ...facture,
      message: 'La facture a été modifiée.',
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
