export type CreateCategorieActe = {
  nomCategorie: string;
};

export type UpdateCategorieActe = Partial<CreateCategorieActe>;

export type ReadCategorieActe = {
  id: number;
  nomCategorie: string;
};
