export type CreateAgentCategory = {
  codeCategory: string;
};

export type UpdatePartialAgentCategory = {
  codeCategory?: string | null;
};

export type ReadAgentCategory = {
  id: number;
  codeCategory: string;
};
