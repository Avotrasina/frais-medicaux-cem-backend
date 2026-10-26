export type AgentPersonDeletionData = {
  id: number;
  beneficiaire: {
    id: number;
    attestations: { id: number }[];
  } | null;
};

export type AgentFamilyDeletionData = {
  id: number;
  carteSocialePath: string;
  conjoint: { id: number } | null;
  enfant: { id: number } | null;
  personne: AgentPersonDeletionData;
};

export type AgentDeletionData = {
  id: number;
  matricule: number;
  carteProfessionnellePath: string;
  personne: AgentPersonDeletionData;
  familleAgent: AgentFamilyDeletionData[];
};
