export type ReadFamilleAgent = {
  id: number;
  agentMatricule: string;
  carteSocialePath: string;
};

export type CreateFamilleAgent = {
  id: number;
  agentMatricule: string;
  carteSocialePath: string;
};

export type UpdateFamilleAgent = Partial<Omit<CreateFamilleAgent, "id">>;