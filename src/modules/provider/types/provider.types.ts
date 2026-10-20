import type { Readable } from "node:stream";

export const ProviderStatus = {
  PRIVE: "PRIVE",
  PUBLIC: "PUBLIC",
} as const;
export type ProviderStatus =
  (typeof ProviderStatus)[keyof typeof ProviderStatus];

export type CreateProvider = {
  nom: string;
  adresse: string;
  statut: ProviderStatus;
  nif: string;
  stat: string;
  dateDebutConvention: Date;
  dateFinConvention: Date;
  listePrestation: string;
  lieuID: number;
  categorieID: number;
};

export type UpdatePartialProvider = Partial<CreateProvider>;

export type ReadProvider = {
  id: number;
  nom: string;
  adresse: string;
  statut: ProviderStatus;
  nif: string;
  stat: string;
  dateDebutConvention: Date;
  dateFinConvention: Date;
  listePrestation: string;
  lieuID: number;
  categorieID: number;
};

export type FilterProvider = {
  lieuID?: number;
  categorieID?: number;
};

export type ConventionStreamPart = {
  stream: Readable;
  fileName: string;
  mimeType: string;
};
