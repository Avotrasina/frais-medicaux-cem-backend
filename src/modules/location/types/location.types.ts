export type CreateLieu = {
  nom: string;
};

export type UpdatePartialLieu = {
  nom?: string | null;
};

export type ReadLieu = {
  id: number;
  nom: string;
};