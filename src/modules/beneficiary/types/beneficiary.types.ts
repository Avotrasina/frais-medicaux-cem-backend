import type { ReadPersonne, Sexe } from "../../personne/personne.types.js";
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
  | { type: "AGENT"; matricule: string }
  | {
      type: "CONJOINT";
      numConjoint: number;
      agentMatricule: string;
      carteSocialePath: string;
    }
  | {
      type: "ENFANT";
      numEnfant: number;
      agentMatricule: string;
      carteSocialePath: string;
    };

export type ReadBeneficiary = ReadPersonne &
  ReadBeneficiaryBase & {
    lien: BeneficiaryLien | null;
  };

export type ReadBeneficiaryByMatricule = {
  nom: string;
  prenom: string;
  dateNaissance: Date;
  sexe: Sexe;
  idp: string;
  observationIDP: string | null;
  matricule: string;
  codeFamille: CodeFamille;
  carteSocialePath: string | null;
  carteProfessionnellePath: string | null;
};