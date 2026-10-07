export enum Sexe {
  MASCULIN = "MASCULIN",
  FEMININ = "FEMININ",
}

export type CreatePersonne = {
  nom: string;
  prenom: string;
  dateNaissance: Date;
  sexe: Sexe;
};

export type ReadPersonne = {
  id: number;
  nom: string;
  prenom: string;
  dateNaissance: Date;
  sexe: Sexe;
};

export type UpdatePartialPersonne = {
  nom?: string | null;
  prenom?: string | null;
  dateNaissance?: Date | null;
  sexe?: Sexe | null;
};