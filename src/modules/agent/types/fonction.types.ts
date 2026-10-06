export type ReadFonction = {
  id: number;
  nom: string;
};

export type CreateFonction = {
  nom: string;
};

export type UpdateFonction = Partial<CreateFonction>;