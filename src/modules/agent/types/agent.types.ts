import type { ReadPersonne } from "../../agent/types/personne.types.js";

export type ReadPersonneAgent = ReadPersonne & {
  agent: ReadAgent;
};


export const AgentType = {
  AGENT_ACTIF: "AGENT_ACTIF",
  AGENT_RETRAITE: "AGENT_RETRAITE",
} as const;
export type AgentType = (typeof AgentType)[keyof typeof AgentType];

export const StatutPEC = {
  AGENT: "AGENT",
  DIRECTEUR: "DIRECTEUR",
  CHEF_SERVICE: "CHEF_SERVICE",
  CHEF_AGENCE: "CHEF_AGENCE",
} as const;
export type StatutPEC = (typeof StatutPEC)[keyof typeof StatutPEC];

export type CreateAgent = {
  id: number;
  matricule: string;
  fonctionID?: number | null;
  statutPEC: StatutPEC;
  observationMatricule?: string | null;
  carteProfessionnellePath: string;
  dateEntree: Date;
  agentType: AgentType;
  structureID?: string | null;
  codeDirection?: string | null;
  codeService?: string | null;
  codeAgence?: string | null;
  categorieID?: string | null;
};

export type ReadAgent = {
  id: number;
  matricule: string;
  fonctionID?: number | null;
  statutPEC: StatutPEC;
  observationMatricule?: string | null;
  carteProfessionnellePath: string;
  dateEntree: Date;
  agentType: AgentType;
  structureID?: string | null;
  codeDirection?: string | null;
  codeService?: string | null;
  codeAgence?: string | null;
  categorieID?: string | null;
};

export type UpdatePartialAgent = {
  matricule: string;
  fonctionID?: number | null;
  statutPEC?: StatutPEC | null;
  observationMatricule?: string | null;
  dateEntree?: Date | null;
  agentType?: AgentType | null;
  structureID?: string | null;
  codeDirection?: string | null;
  codeService?: string | null;
  codeAgence?: string | null;
  categorieID?: string | null;
};