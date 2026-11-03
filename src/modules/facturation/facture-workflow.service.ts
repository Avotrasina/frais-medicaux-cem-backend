import {
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  RoleUtilisateur,
  StatutFacture,
} from '../../generated/prisma/enums.js';
import { FacturePermissionsService } from './facture-permissions.service.js';
import { ActionFacture } from './action-facture.js';

export { ActionFacture } from './action-facture.js';

interface TransitionAutorisee {
  statutSuivant: StatutFacture;
  roles: readonly RoleUtilisateur[];
}

const TRANSITIONS: Record<
  ActionFacture,
  Partial<Record<StatutFacture, TransitionAutorisee>>
> = {
  [ActionFacture.RETOUR_PRESTATAIRE]: {
    [StatutFacture.ENREGISTREE]: {
      statutSuivant: StatutFacture.RETOURNEE,
      roles: [RoleUtilisateur.OPERATEUR],
    },
  },
  [ActionFacture.RECEPTION_APRES_MODIFICATION]: {
    [StatutFacture.RETOURNEE]: {
      statutSuivant: StatutFacture.ENREGISTREE,
      roles: [RoleUtilisateur.OPERATEUR],
    },
  },
  [ActionFacture.ENVOI_VALIDATION]: {
    [StatutFacture.ENREGISTREE]: {
      statutSuivant: StatutFacture.EN_VALIDATION,
      roles: [RoleUtilisateur.OPERATEUR],
    },
    [StatutFacture.A_REVALIDER]: {
      statutSuivant: StatutFacture.EN_VALIDATION,
      roles: [RoleUtilisateur.OPERATEUR],
    },
  },
  [ActionFacture.VALIDATION]: {
    [StatutFacture.EN_VALIDATION]: {
      statutSuivant: StatutFacture.VALIDEE,
      roles: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF],
    },
  },
  [ActionFacture.RETOUR_CORRECTION]: {
    [StatutFacture.EN_VALIDATION]: {
      statutSuivant: StatutFacture.ENREGISTREE,
      roles: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF],
    },
  },
  [ActionFacture.SORTIE]: {
    [StatutFacture.VALIDEE]: {
      statutSuivant: StatutFacture.SORTIE,
      roles: [RoleUtilisateur.OPERATEUR],
    },
  },
  [ActionFacture.REOUVERTURE]: {
    [StatutFacture.VALIDEE]: { statutSuivant: StatutFacture.A_REVALIDER, roles: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF] },
    [StatutFacture.SORTIE]: { statutSuivant: StatutFacture.A_REVALIDER, roles: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF] },
  },
  [ActionFacture.DEMANDE_SUPPRESSION]: {
    [StatutFacture.ENREGISTREE]: { statutSuivant: StatutFacture.SUPPRESSION_DEMANDEE, roles: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF] },
    [StatutFacture.EN_VALIDATION]: { statutSuivant: StatutFacture.SUPPRESSION_DEMANDEE, roles: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF] },
    [StatutFacture.RETOURNEE]: { statutSuivant: StatutFacture.SUPPRESSION_DEMANDEE, roles: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF] },
    [StatutFacture.VALIDEE]: { statutSuivant: StatutFacture.SUPPRESSION_DEMANDEE, roles: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF] },
    [StatutFacture.SORTIE]: { statutSuivant: StatutFacture.SUPPRESSION_DEMANDEE, roles: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF] },
    [StatutFacture.A_REVALIDER]: { statutSuivant: StatutFacture.SUPPRESSION_DEMANDEE, roles: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF] },
  },
  [ActionFacture.VALIDATION_SUPPRESSION]: {
    [StatutFacture.SUPPRESSION_DEMANDEE]: { statutSuivant: StatutFacture.SUPPRIMEE, roles: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF] },
  },
  [ActionFacture.REFUS_SUPPRESSION]: {
    [StatutFacture.SUPPRESSION_DEMANDEE]: { statutSuivant: StatutFacture.ENREGISTREE, roles: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF] },
  },
  [ActionFacture.MODIFIER_INFORMATIONS]: {
    [StatutFacture.ENREGISTREE]: {
      statutSuivant: StatutFacture.ENREGISTREE,
      roles: [RoleUtilisateur.OPERATEUR],
    },
    [StatutFacture.RETOURNEE]: {
      statutSuivant: StatutFacture.RETOURNEE,
      roles: [RoleUtilisateur.OPERATEUR],
    },
    [StatutFacture.A_REVALIDER]: {
      statutSuivant: StatutFacture.A_REVALIDER,
      roles: [RoleUtilisateur.OPERATEUR],
    },
    [StatutFacture.VALIDEE]: {
      statutSuivant: StatutFacture.EN_VALIDATION,
      roles: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF],
    },
    [StatutFacture.SORTIE]: {
      statutSuivant: StatutFacture.EN_VALIDATION,
      roles: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF],
    },
  },
  [ActionFacture.MODIFIER_MONTANTS]: {
    [StatutFacture.ENREGISTREE]: {
      statutSuivant: StatutFacture.ENREGISTREE,
      roles: [RoleUtilisateur.OPERATEUR],
    },
    [StatutFacture.A_REVALIDER]: {
      statutSuivant: StatutFacture.A_REVALIDER,
      roles: [RoleUtilisateur.OPERATEUR],
    },
    [StatutFacture.VALIDEE]: {
      statutSuivant: StatutFacture.EN_VALIDATION,
      roles: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF],
    },
    [StatutFacture.SORTIE]: {
      statutSuivant: StatutFacture.EN_VALIDATION,
      roles: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF],
    },
  },
  [ActionFacture.SUIVI_CREER]: {},
  [ActionFacture.SUIVI_MODIFIER]: {},
  [ActionFacture.SUIVI_SUPPRIMER]: {},
};

/** Décide des transitions facture sans accès à la base de données. */
@Injectable()
export class FactureWorkflowService {
  constructor(
    @Inject(FacturePermissionsService)
    private readonly permissions: FacturePermissionsService =
      new FacturePermissionsService(),
  ) {}

  verifierEditionLigne(statut: StatutFacture): void {
    if (
      statut === StatutFacture.ENREGISTREE ||
      statut === StatutFacture.A_REVALIDER
    ) {
      return;
    }

    throw new ConflictException(
      'Les lignes ne sont modifiables que lorsque la facture est enregistrée ou à revalider.',
    );
  }

  verifierModificationRetenue(statut: StatutFacture): void {
    if (
      statut === StatutFacture.ENREGISTREE ||
      statut === StatutFacture.A_REVALIDER ||
      statut === StatutFacture.VALIDEE ||
      statut === StatutFacture.SORTIE
    ) {
      return;
    }

    throw new ConflictException(
      'La retenue ne peut pas être modifiée pour le statut actuel de la facture.',
    );
  }

  determinerTransition(
    statutActuel: StatutFacture,
    action: ActionFacture,
    role: RoleUtilisateur,
  ): StatutFacture {
    this.permissions.verifier(action, role);

    const transition = TRANSITIONS[action][statutActuel];
    if (transition === undefined) {
      throw new ConflictException(
        `L'action ${action} est interdite lorsque la facture est au statut ${statutActuel}.`,
      );
    }

    return transition.statutSuivant;
  }
}
