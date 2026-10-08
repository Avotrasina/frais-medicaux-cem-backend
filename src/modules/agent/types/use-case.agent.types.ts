import type { Sexe } from "../../personne/personne.types.js";
import type { StatutPEC, BackOfficeFrontOffice } from "./agent.enum.types.js";

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

export type AgentUpdatePartial= {
  matricule: string;
  nom?: string | null;
  prenom?: string | null;
  statutPEC?: StatutPEC | null;
  dateNaissance?: Date | null;
  sexe?: Sexe | null;
  backOfficeFrontOffice?: BackOfficeFrontOffice | null;
  observationMatricule?: string | null;
  dateEntree?: Date | null;

  fonctionID?: number | null;
  categorieID?: string | null;
  codeDirection?: string | null;
  codeAgence?: string | null;
  codeService?: string | null;
}

export type AgentUpdateProfCard ={
    matricule: string;
    carteProfessionnellePath: string;
}
export type FilterOptions = {
  backOfficeFrontOffice?: BackOfficeFrontOffice | null;
  codeDirection?: string | null;
  codeService?: string | null;
  codeAgence?: string | null;
};
