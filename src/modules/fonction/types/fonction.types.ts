export type CreateFonction = {
  nom: string;
};

export type UpdatePartialFonction = {
  nom?: string | null;
};

export type ReadFonction = {
  id: number;
  nom: string;
};