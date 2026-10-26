export type AgentFamilyMemberType = 'conjoint' | 'enfant';

export type AgentFamilyDeletionData = {
  familleAgent: {
    id: number;
    carteSocialePath: string;
    personne: {
      id: number;
      beneficiaire: { id: number; attestations: { id: number }[] } | null;
    };
  };
};
