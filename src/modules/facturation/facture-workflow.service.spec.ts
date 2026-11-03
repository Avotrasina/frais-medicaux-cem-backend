import { ConflictException, ForbiddenException } from '@nestjs/common';
import {
  RoleUtilisateur,
  StatutFacture,
} from '../../generated/prisma/enums.js';
import {
  ActionFacture,
  FactureWorkflowService,
} from './facture-workflow.service.js';

describe('FactureWorkflowService', () => {
  const service = new FactureWorkflowService();
  afterEach(() => delete process.env.PERMISSIONS_ROLES_ACTIVES);

  it('accepte les transitions métier avec les rôles désactivés', () => {
    delete process.env.PERMISSIONS_ROLES_ACTIVES;
    expect(
      service.determinerTransition(
        StatutFacture.VALIDEE,
        ActionFacture.REOUVERTURE,
        RoleUtilisateur.OPERATEUR,
      ),
    ).toBe(StatutFacture.A_REVALIDER);
    expect(
      service.determinerTransition(
        StatutFacture.A_REVALIDER,
        ActionFacture.ENVOI_VALIDATION,
        RoleUtilisateur.CHEF,
      ),
    ).toBe(StatutFacture.EN_VALIDATION);
    expect(
      service.determinerTransition(
        StatutFacture.SUPPRESSION_DEMANDEE,
        ActionFacture.VALIDATION_SUPPRESSION,
        RoleUtilisateur.OPERATEUR,
      ),
    ).toBe(StatutFacture.SUPPRIMEE);
  });

  it('applique la table de rôles lorsqu’elle est activée', () => {
    process.env.PERMISSIONS_ROLES_ACTIVES = 'true';
    expect(() =>
      service.determinerTransition(
        StatutFacture.ENREGISTREE,
        ActionFacture.ENVOI_VALIDATION,
        RoleUtilisateur.CHEF,
      ),
    ).toThrow(ForbiddenException);
    expect(
      service.determinerTransition(
        StatutFacture.ENREGISTREE,
        ActionFacture.ENVOI_VALIDATION,
        RoleUtilisateur.OPERATEUR,
      ),
    ).toBe(StatutFacture.EN_VALIDATION);
  });

  it('refuse les transitions absentes, y compris depuis SUPPRIMEE', () => {
    delete process.env.PERMISSIONS_ROLES_ACTIVES;
    expect(() =>
      service.determinerTransition(
        StatutFacture.SUPPRIMEE,
        ActionFacture.VALIDATION,
        RoleUtilisateur.OPERATEUR,
      ),
    ).toThrow(ConflictException);
    expect(() =>
      service.determinerTransition(
        StatutFacture.ENREGISTREE,
        ActionFacture.VALIDATION,
        RoleUtilisateur.OPERATEUR,
      ),
    ).toThrow(ConflictException);
  });

  it('autorise les lignes uniquement en ENREGISTREE et A_REVALIDER', () => {
    expect(() =>
      service.verifierEditionLigne(StatutFacture.ENREGISTREE),
    ).not.toThrow();
    expect(() =>
      service.verifierEditionLigne(StatutFacture.A_REVALIDER),
    ).not.toThrow();

    for (const statut of [
      StatutFacture.RETOURNEE,
      StatutFacture.EN_VALIDATION,
      StatutFacture.SUPPRESSION_DEMANDEE,
      StatutFacture.SUPPRIMEE,
      StatutFacture.VALIDEE,
      StatutFacture.SORTIE,
    ]) {
      expect(() => service.verifierEditionLigne(statut)).toThrow(
        ConflictException,
      );
    }
  });

  it('permet les retenues en ENREGISTREE, A_REVALIDER, VALIDEE et SORTIE', () => {
    for (const statut of [
      StatutFacture.ENREGISTREE,
      StatutFacture.A_REVALIDER,
      StatutFacture.VALIDEE,
      StatutFacture.SORTIE,
    ]) {
      expect(() => service.verifierModificationRetenue(statut)).not.toThrow();
    }

    for (const statut of [
      StatutFacture.RETOURNEE,
      StatutFacture.EN_VALIDATION,
      StatutFacture.SUPPRESSION_DEMANDEE,
      StatutFacture.SUPPRIMEE,
    ]) {
      expect(() => service.verifierModificationRetenue(statut)).toThrow(
        ConflictException,
      );
    }
  });
});
