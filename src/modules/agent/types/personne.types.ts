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

export type UpdatePersonne = {
  nom: string;
  prenom: string;
  dateNaissance: Date;
  sexe: Sexe;
};