import type { Sexe } from "./personne.types.js";
import type { StatutPEC, BackOfficeFrontOffice } from "./enum.types.js";

// Pour les use cases d'enregistrement et de mise à jour d'un agent
export type AgentUseCaseTypes = {
  matricule: string;
  nom: string;
  prenom: string;
  statutPEC: StatutPEC;
  dateNaissance: Date;
  sexe: Sexe;
  backOfficeFrontOffice: BackOfficeFrontOffice;
  observationMatricule?: string | null;
  carteProfessionnellePath: string;
  dateEntree: Date;

  fonctionID?: number | null;
  categorieID?: string | null;
  codeDirection?: string | null;
  codeAgence?: string | null;
  codeService?: string | null;
};