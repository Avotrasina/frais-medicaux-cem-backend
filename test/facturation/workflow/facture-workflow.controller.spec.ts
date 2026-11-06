import { BadRequestException, UnprocessableEntityException } from '@nestjs/common';
import {
  RoleUtilisateur,
  ServiceSortie,
  TypeMouvement,
} from '../../../src/generated/prisma/enums.js';
import type { MouvementFacture } from '../../../src/generated/prisma/client.js';
import {
  ActionFactureDto,
} from '../../../src/modules/facturation/dtos/facture-workflow.dto.js';
import type {
  ActeurFacture,
  OptionsActionFacture,
} from '../../../src/modules/facturation/factures/globale/facture-globale.service.js';
import { FactureGlobaleService } from '../../../src/modules/facturation/factures/globale/facture-globale.service.js';
import {
  FactureWorkflowController,
  VALIDATION_ACTION,
} from '../../../src/modules/facturation/factures/workflow/facture-workflow.controller.js';

vi.mock('../../../src/infrastructure/prisma/prisma.service.js', () => ({
  PrismaService: class PrismaService {},
}));

const facture = {
  id: 21,
  montantTotal: { toString: () => '100.00' },
} as unknown as Awaited<ReturnType<FactureGlobaleService['obtenir']>>;
const mouvement = {
  id: 101,
  type: TypeMouvement.ENVOI_VALIDATION,
} as MouvementFacture;
const acteur: ActeurFacture = {
  id: 5,
  role: RoleUtilisateur.OPERATEUR,
};

function creerAction() {
  return vi.fn(
    async (
      _id: number,
      _acteur: ActeurFacture,
      _donnees: object,
      options?: OptionsActionFacture,
    ) => {
      options?.capturerMouvement?.(mouvement);
      return facture;
    },
  );
}

function creerController() {
  const service = {
    validerDateAction: vi.fn().mockResolvedValue(new Date('2026-11-06T00:00:00.000Z')),
    envoyerValidation: creerAction(),
    retournerCorrection: creerAction(),
    retourPrestataire: creerAction(),
    valider: creerAction(),
    sortir: creerAction(),
    demanderSuppression: creerAction(),
    refuserSuppression: creerAction(),
    validerSuppression: creerAction(),
  };
  return {
    controller: new FactureWorkflowController(
      service as unknown as FactureGlobaleService,
    ),
    service,
  };
}

describe('FactureWorkflowController PATCH statut', () => {
  it.each([
    [
      TypeMouvement.ENVOI_VALIDATION,
      { destinataireId: 7, date: '2026-11-06' },
      'envoyerValidation',
    ],
    [
      TypeMouvement.RETOUR_POUR_CORRECTION,
      { remarque: 'À corriger', date: '2026-11-06' },
      'retournerCorrection',
    ],
    [
      TypeMouvement.RETOUR_PRESTATAIRE,
      { remarque: 'Pièce manquante', date: '2026-11-06' },
      'retourPrestataire',
    ],
    [TypeMouvement.VALIDATION, {}, 'valider'],
    [
      TypeMouvement.SORTIE,
      { service: ServiceSortie.CONTROLE, date: '2026-11-06' },
      'sortir',
    ],
    [
      TypeMouvement.DEMANDE_SUPPRESSION,
      { remarque: 'Doublon' },
      'demanderSuppression',
    ],
    [TypeMouvement.REFUS_SUPPRESSION, {}, 'refuserSuppression'],
    [TypeMouvement.SUPPRESSION, {}, 'validerSuppression'],
  ] as const)(
    'délègue %s à son opération existante et retourne son mouvement',
    async (type, champs, methode) => {
      const { controller, service } = creerController();
      const donnees = await VALIDATION_ACTION.transform(
        { type, ...champs },
        { type: 'body', metatype: ActionFactureDto },
      );

      const resultat = await controller.modifierStatut(
        21,
        donnees,
        { user: acteur },
      );

      expect(service[methode]).toHaveBeenCalledOnce();
      expect(resultat).toMatchObject({ id: 21, mouvement: { id: 101 } });
    },
  );

  it('refuse ENREGISTREMENT et MODIFICATION avec 422', async () => {
    for (const type of [
      TypeMouvement.ENREGISTREMENT,
      TypeMouvement.MODIFICATION,
    ]) {
      await expect(
        VALIDATION_ACTION.transform(
          { type },
          { type: 'body', metatype: ActionFactureDto },
        ),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    }
  });

  it('rejette une date calendaire invalide', async () => {
    await expect(
      VALIDATION_ACTION.transform(
        {
          type: TypeMouvement.RETOUR_PRESTATAIRE,
          remarque: 'À vérifier',
          date: '2026-02-31',
        },
        { type: 'body', metatype: ActionFactureDto },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('transmet la date validée et refuse date pour un type non datable', async () => {
    const { controller, service } = creerController();

    await controller.modifierStatut(
      21,
      { type: TypeMouvement.SORTIE, service: ServiceSortie.CONTROLE, date: '2026-11-06' },
      { user: acteur },
    );
    expect(service.validerDateAction).toHaveBeenCalledWith(21, '2026-11-06');

    await expect(
      controller.modifierStatut(
        21,
        { type: TypeMouvement.VALIDATION, date: '2026-11-06' },
        { user: acteur },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
