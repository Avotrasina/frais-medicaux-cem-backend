import type { Sexe } from "../../personne/personne.types.js";
import type { CodeFamille } from "./idp.types.js";

export type CreateBeneficiary = {
  id: number;
  observationIDP?: string | null;
  codeFamille: CodeFamille;
  numConjoint?: number | null;
  numEnfant?: number | null;
};

export type UpdateObservationBeneficiary = {
  observationIDP: string | null;
};

export type ReadBeneficiaryBase = {
  id: number;
  idp: string;
  observationIDP: string | null;
};

export type BeneficiaryLien =
  | { type: "AGENT"; matricule: number }
  | {
      type: "CONJOINT";
      numConjoint: number;
      agentMatricule: number;
      carteSocialePath: string;
    }
  | {
      type: "ENFANT";
      numEnfant: number;
      agentMatricule: number;
      carteSocialePath: string;
    };

  export type ReadBeneficiary = {
  nom: string;
  prenom: string;
  dateNaissance: Date;
  sexe: Sexe;
  idp: string;
  observationIDP: string | null;
  matricule: number;
  codeFamille: CodeFamille;
  carteSocialePath: string | null;
  carteProfessionnellePath: string | null;
};
