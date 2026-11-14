import { ConflictException, Inject, Injectable } from '@nestjs/common';
import {
  RoleUtilisateur,
  StatutFacture,
  TypeMouvement,
} from '../../../../generated/prisma/enums.js';
import { FacturePermissionsService } from '../../shared/facture-permissions.service.js';
import { ActionFacture } from '../../shared/action-facture.js';

export { ActionFacture } from '../../shared/action-facture.js';

interface TransitionAutorisee {
  statutSuivant?: StatutFacture;
  roles: readonly RoleUtilisateur[];
}

interface DefinitionAction {
  type?: TypeMouvement;
  champsRequis: readonly string[];
  depuis: Partial<Record<StatutFacture, TransitionAutorisee>>;
}

export interface TransitionFactureDisponible {
  type: TypeMouvement;
  statutResultat: StatutFacture;
  champsRequis: readonly string[];
}

const TRANSITIONS: Record<ActionFacture, DefinitionAction> = {
  [ActionFacture.RETOUR_PRESTATAIRE]: {
    type: TypeMouvement.RETOUR_PRESTATAIRE,
    champsRequis: ['remarque'],
    depuis: {
      [StatutFacture.ENREGISTREE]: {
        statutSuivant: StatutFacture.RETOURNEE,
        roles: [RoleUtilisateur.OPERATEUR],
      },
    },
  },
  [ActionFacture.ENVOI_VALIDATION]: {
    type: TypeMouvement.ENVOI_VALIDATION,
    champsRequis: ['destinataireId'],
    depuis: {
      [StatutFacture.ENREGISTREE]: {
        statutSuivant: StatutFacture.EN_VALIDATION,
        roles: [RoleUtilisateur.OPERATEUR],
      },
      [StatutFacture.A_CORRIGER]: {
        statutSuivant: StatutFacture.EN_VALIDATION,
        roles: [RoleUtilisateur.OPERATEUR],
      },
    },
  },
  [ActionFacture.VALIDATION]: {
    type: TypeMouvement.VALIDATION,
    champsRequis: [],
    depuis: {
      [StatutFacture.EN_VALIDATION]: {
        statutSuivant: StatutFacture.VALIDEE,
        roles: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF],
      },
    },
  },
  [ActionFacture.RETOUR_CORRECTION]: {
    type: TypeMouvement.RETOUR_POUR_CORRECTION,
    champsRequis: ['remarque'],
    depuis: {
      [StatutFacture.EN_VALIDATION]: {
        statutSuivant: StatutFacture.A_CORRIGER,
        roles: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF],
      },
    },
  },
  [ActionFacture.SORTIE]: {
    type: TypeMouvement.SORTIE,
    champsRequis: ['service'],
    depuis: {
      [StatutFacture.VALIDEE]: {
        statutSuivant: StatutFacture.SORTIE,
        roles: [RoleUtilisateur.OPERATEUR],
      },
    },
  },
  [ActionFacture.DEMANDE_SUPPRESSION]: {
    type: TypeMouvement.DEMANDE_SUPPRESSION,
    champsRequis: ['remarque'],
    depuis: {
      [StatutFacture.ENREGISTREE]: {
        statutSuivant: StatutFacture.SUPPRESSION_DEMANDEE,
        roles: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF],
      },
      [StatutFacture.EN_VALIDATION]: {
        statutSuivant: StatutFacture.SUPPRESSION_DEMANDEE,
        roles: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF],
      },
      [StatutFacture.RETOURNEE]: {
        statutSuivant: StatutFacture.SUPPRESSION_DEMANDEE,
        roles: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF],
      },
      [StatutFacture.VALIDEE]: {
        statutSuivant: StatutFacture.SUPPRESSION_DEMANDEE,
        roles: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF],
      },
      [StatutFacture.SORTIE]: {
        statutSuivant: StatutFacture.SUPPRESSION_DEMANDEE,
        roles: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF],
      },
      [StatutFacture.A_CORRIGER]: {
        statutSuivant: StatutFacture.SUPPRESSION_DEMANDEE,
        roles: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF],
      },
    },
  },
  [ActionFacture.VALIDATION_SUPPRESSION]: {
    type: TypeMouvement.SUPPRESSION,
    champsRequis: [],
    depuis: {
      [StatutFacture.SUPPRESSION_DEMANDEE]: {
        statutSuivant: StatutFacture.SUPPRIMEE,
        roles: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF],
      },
    },
  },
  [ActionFacture.REFUS_SUPPRESSION]: {
    type: TypeMouvement.REFUS_SUPPRESSION,
    champsRequis: [],
    depuis: {
      [StatutFacture.SUPPRESSION_DEMANDEE]: {
        roles: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF],
      },
    },
  },
  [ActionFacture.MODIFIER_INFORMATIONS]: {
    champsRequis: [],
    depuis: {
      [StatutFacture.ENREGISTREE]: {
        statutSuivant: StatutFacture.ENREGISTREE,
        roles: [RoleUtilisateur.OPERATEUR],
      },
      [StatutFacture.EN_VALIDATION]: {
        statutSuivant: StatutFacture.ENREGISTREE,
        roles: [RoleUtilisateur.OPERATEUR],
      },
      [StatutFacture.RETOURNEE]: {
        statutSuivant: StatutFacture.ENREGISTREE,
        roles: [RoleUtilisateur.OPERATEUR],
      },
      [StatutFacture.VALIDEE]: {
        statutSuivant: StatutFacture.ENREGISTREE,
        roles: [RoleUtilisateur.OPERATEUR],
      },
      [StatutFacture.SORTIE]: {
        statutSuivant: StatutFacture.ENREGISTREE,
        roles: [RoleUtilisateur.OPERATEUR],
      },
      [StatutFacture.A_CORRIGER]: {
        statutSuivant: StatutFacture.ENREGISTREE,
        roles: [RoleUtilisateur.OPERATEUR],
      },
    },
  },
  [ActionFacture.MODIFIER_MONTANTS]: {
    champsRequis: [],
    depuis: {
      [StatutFacture.ENREGISTREE]: {
        statutSuivant: StatutFacture.ENREGISTREE,
        roles: [RoleUtilisateur.OPERATEUR],
      },
      [StatutFacture.EN_VALIDATION]: {
        statutSuivant: StatutFacture.ENREGISTREE,
        roles: [RoleUtilisateur.OPERATEUR],
      },
      [StatutFacture.RETOURNEE]: {
        statutSuivant: StatutFacture.ENREGISTREE,
        roles: [RoleUtilisateur.OPERATEUR],
      },
      [StatutFacture.VALIDEE]: {
        statutSuivant: StatutFacture.ENREGISTREE,
        roles: [RoleUtilisateur.OPERATEUR],
      },
      [StatutFacture.SORTIE]: {
        statutSuivant: StatutFacture.ENREGISTREE,
        roles: [RoleUtilisateur.OPERATEUR],
      },
      [StatutFacture.A_CORRIGER]: {
        statutSuivant: StatutFacture.ENREGISTREE,
        roles: [RoleUtilisateur.OPERATEUR],
      },
    },
  },
  [ActionFacture.SUIVI_CREER]: { champsRequis: [], depuis: {} },
  [ActionFacture.SUIVI_MODIFIER]: { champsRequis: [], depuis: {} },
  [ActionFacture.SUIVI_SUPPRIMER]: { champsRequis: [], depuis: {} },
};

/** Décide des transitions facture sans accès à la base de données. */
@Injectable()
export class FactureWorkflowService {
  constructor(
    @Inject(FacturePermissionsService)
    private readonly permissions: FacturePermissionsService = new FacturePermissionsService(),
  ) {}

  verifierEditionLigne(statut: StatutFacture): void {
    if (
      statut === StatutFacture.ENREGISTREE ||
      statut === StatutFacture.A_CORRIGER
    )
      return;
    throw new ConflictException(
      'La facture ne permet pas la modification des lignes.',
    );
  }

  verifierModificationRetenue(statut: StatutFacture): void {
    if (
      statut === StatutFacture.ENREGISTREE ||
      statut === StatutFacture.A_CORRIGER ||
      statut === StatutFacture.VALIDEE ||
      statut === StatutFacture.SORTIE
    )
      return;
    throw new ConflictException(
      'La facture ne permet pas la modification de la retenue.',
    );
  }

  determinerTransition(
    statutActuel: StatutFacture,
    action: ActionFacture,
    role: RoleUtilisateur,
    statutSuivantDynamique?: StatutFacture,
  ): StatutFacture {
    this.permissions.verifier(action, role);

    const transition = TRANSITIONS[action].depuis[statutActuel];
    if (transition === undefined) {
      throw new ConflictException(
        `L'action ${action} est interdite lorsque la facture est au statut ${statutActuel}.`,
      );
    }

    return this.resoudreStatutSuivant(
      transition,
      action,
      statutActuel,
      statutSuivantDynamique,
    );
  }

  listerTransitions(
    statutActuel: StatutFacture,
    statutSuivantDynamique?: StatutFacture,
  ): TransitionFactureDisponible[] {
    return (Object.keys(TRANSITIONS) as ActionFacture[]).flatMap((action) => {
      const definition = TRANSITIONS[action];
      if (definition.type === undefined) return [];
      const transition = definition.depuis[statutActuel];
      if (transition === undefined) return [];
      return [
        {
          type: definition.type,
          statutResultat: this.resoudreStatutSuivant(
            transition,
            action,
            statutActuel,
            statutSuivantDynamique,
          ),
          champsRequis: definition.champsRequis,
        },
      ];
    });
  }

  private resoudreStatutSuivant(
    transition: TransitionAutorisee,
    action: ActionFacture,
    statutActuel: StatutFacture,
    statutSuivantDynamique?: StatutFacture,
  ): StatutFacture {
    const statutSuivant = transition.statutSuivant ?? statutSuivantDynamique;
    if (statutSuivant === undefined) {
      throw new ConflictException(
        `L'action ${action} n'a pas de statut cible défini pour le statut ${statutActuel}.`,
      );
    }

    return statutSuivant;
  }
}
