export type CreateProviderCategory = {
  nom: string;
};

export type UpdatePartialProviderCategory = {
  nom?: string | null;
};

export type ReadProviderCategory = {
  id: number;
  nom: string;
};