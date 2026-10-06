export interface ReadFonction {
  id: number;
  nom: string;
}

export interface CreateFonction {
  nom: string;
}

export type UpdateFonction = Partial<CreateFonction>;