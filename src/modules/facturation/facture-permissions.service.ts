import { ForbiddenException, Injectable } from '@nestjs/common';
import { RoleUtilisateur } from '../../generated/prisma/enums.js';
import { ActionFacture } from './action-facture.js';

/** Rôles hérités du workflow actuel; ils restent à confirmer par le métier. */
export const ROLES_ACTION_FACTURE: Readonly<Record<ActionFacture, readonly RoleUtilisateur[]>> = {
  [ActionFacture.RETOUR_PRESTATAIRE]: [RoleUtilisateur.OPERATEUR],
  [ActionFacture.RECEPTION_APRES_MODIFICATION]: [RoleUtilisateur.OPERATEUR],
  [ActionFacture.ENVOI_VALIDATION]: [RoleUtilisateur.OPERATEUR],
  [ActionFacture.VALIDATION]: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF],
  [ActionFacture.RETOUR_CORRECTION]: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF],
  [ActionFacture.SORTIE]: [RoleUtilisateur.OPERATEUR],
  [ActionFacture.REOUVERTURE]: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF],
  [ActionFacture.DEMANDE_SUPPRESSION]: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF],
  [ActionFacture.VALIDATION_SUPPRESSION]: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF],
  [ActionFacture.REFUS_SUPPRESSION]: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF],
  [ActionFacture.MODIFIER_INFORMATIONS]: [RoleUtilisateur.OPERATEUR],
  [ActionFacture.MODIFIER_MONTANTS]: [RoleUtilisateur.OPERATEUR],
  [ActionFacture.SUIVI_CREER]: [RoleUtilisateur.OPERATEUR],
  [ActionFacture.SUIVI_MODIFIER]: [RoleUtilisateur.OPERATEUR],
  [ActionFacture.SUIVI_SUPPRIMER]: [RoleUtilisateur.OPERATEUR],
};

@Injectable()
export class FacturePermissionsService {
  estActive(): boolean {
    return process.env.PERMISSIONS_ROLES_ACTIVES?.toLowerCase() === 'true';
  }

  verifier(action: ActionFacture, role: RoleUtilisateur): void {
    if (!this.estActive()) return;
    if (ROLES_ACTION_FACTURE[action].includes(role)) return;
    throw new ForbiddenException(
      `Le rôle ${role} n'est pas autorisé à effectuer cette action.`,
    );
  }
}
