export type ReadCategorieAgent = {
  id: number;
  codeCategory: string;
};

export type CreateCategorieAgent = {
  codeCategory: string;
};

export type UpdateCategorieAgent = Partial<CreateCategorieAgent>;