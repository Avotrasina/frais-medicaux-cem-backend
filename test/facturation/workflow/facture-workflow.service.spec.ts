import { ConflictException } from '@nestjs/common';
import {
  RoleUtilisateur,
  StatutFacture,
  TypeMouvement,
} from '../../../src/generated/prisma/enums.js';
import { FacturePermissionsService } from '../../../src/modules/facturation/shared/facture-permissions.service.js';
import {
  ActionFacture,
  FactureWorkflowService,
} from '../../../src/modules/facturation/factures/workflow/facture-workflow.service.js';

function creerWorkflow(): FactureWorkflowService {
  return new FactureWorkflowService({
    verifier: vi.fn(),
  } as unknown as FacturePermissionsService);
}

describe('FactureWorkflowService', () => {
  const workflow = creerWorkflow();

  it('retourne une facture en correction et permet son envoi en validation', () => {
    expect(
      workflow.determinerTransition(
        StatutFacture.EN_VALIDATION,
        ActionFacture.RETOUR_CORRECTION,
        RoleUtilisateur.CHEF,
      ),
    ).toBe(StatutFacture.A_CORRIGER);
    expect(
      workflow.determinerTransition(
        StatutFacture.A_CORRIGER,
        ActionFacture.ENVOI_VALIDATION,
        RoleUtilisateur.OPERATEUR,
      ),
    ).toBe(StatutFacture.EN_VALIDATION);
  });

  it.each([
    ActionFacture.MODIFIER_INFORMATIONS,
    ActionFacture.MODIFIER_MONTANTS,
  ])('permet de modifier une facture en %s', (action) => {
    for (const statut of [StatutFacture.VALIDEE, StatutFacture.SORTIE]) {
      expect(
        workflow.determinerTransition(statut, action, RoleUtilisateur.OPERATEUR),
      ).toBe(StatutFacture.ENREGISTREE);
    }
  });

  it('utilise le statut avant suppression comme cible dynamique', () => {
    expect(
      workflow.determinerTransition(
        StatutFacture.SUPPRESSION_DEMANDEE,
        ActionFacture.REFUS_SUPPRESSION,
        RoleUtilisateur.CHEF,
        StatutFacture.A_CORRIGER,
      ),
    ).toBe(StatutFacture.A_CORRIGER);
    expect(() =>
      workflow.determinerTransition(
        StatutFacture.SUPPRESSION_DEMANDEE,
        ActionFacture.REFUS_SUPPRESSION,
        RoleUtilisateur.CHEF,
      ),
    ).toThrow(ConflictException);
  });

  it('expose des transitions cohérentes avec la table de workflow', () => {
    const actionParType = new Map<TypeMouvement, ActionFacture>([
      [TypeMouvement.ENVOI_VALIDATION, ActionFacture.ENVOI_VALIDATION],
      [TypeMouvement.RETOUR_POUR_CORRECTION, ActionFacture.RETOUR_CORRECTION],
      [TypeMouvement.RETOUR_PRESTATAIRE, ActionFacture.RETOUR_PRESTATAIRE],
      [TypeMouvement.VALIDATION, ActionFacture.VALIDATION],
      [TypeMouvement.SORTIE, ActionFacture.SORTIE],
      [TypeMouvement.DEMANDE_SUPPRESSION, ActionFacture.DEMANDE_SUPPRESSION],
      [TypeMouvement.REFUS_SUPPRESSION, ActionFacture.REFUS_SUPPRESSION],
      [TypeMouvement.SUPPRESSION, ActionFacture.VALIDATION_SUPPRESSION],
    ]);
    const statuts = Object.values(StatutFacture);

    for (const statut of statuts) {
      const dynamique =
        statut === StatutFacture.SUPPRESSION_DEMANDEE
          ? StatutFacture.RETOURNEE
          : undefined;
      const transitions = workflow.listerTransitions(statut, dynamique);

      for (const transition of transitions) {
        const action = actionParType.get(transition.type);
        if (action === undefined) {
          throw new Error(
            `Type de transition sans action : ${transition.type}`,
          );
        }
        expect(
          workflow.determinerTransition(
            statut,
            action,
            RoleUtilisateur.CHEF,
            dynamique,
          ),
        ).toBe(transition.statutResultat);
      }
    }

    expect(
      workflow.listerTransitions(StatutFacture.ENREGISTREE).map((transition) => ({
        type: transition.type,
        champsRequis: transition.champsRequis,
      })),
    ).toContainEqual({
      type: 'ENVOI_VALIDATION',
      champsRequis: ['destinataireId'],
    });
  });

  it('bloque toute transition, édition et retenue lorsque la facture est supprimée', () => {
    for (const action of Object.values(ActionFacture)) {
      expect(() =>
        workflow.determinerTransition(
          StatutFacture.SUPPRIMEE,
          action,
          RoleUtilisateur.CHEF,
        ),
      ).toThrow(ConflictException);
    }
    expect(() =>
      workflow.verifierEditionLigne(StatutFacture.SUPPRIMEE),
    ).toThrow(ConflictException);
    expect(() =>
      workflow.verifierModificationRetenue(StatutFacture.SUPPRIMEE),
    ).toThrow(ConflictException);
  });
});
