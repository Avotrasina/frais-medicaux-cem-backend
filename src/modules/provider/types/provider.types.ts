export const ProviderStatus = {
  PRIVE: 'PRIVE',
  PUBLIC: 'PUBLIC',
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
  echeanceRenouvellement?: string | null;
  echeanceResiliation?: string | null;
  observation?: string | null;
  lieuID: number;
  categorieID: number;
  conventionPath: string;
};

export type UpdatePartialProvider = Partial<
  Omit<CreateProvider, 'conventionPath'>
>;

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
  echeanceRenouvellement: string | null;
  echeanceResiliation: string | null;
  observation: string | null;
  lieuID: number;
  categorieID: number;
};

export type FilterProvider = {
  lieuID?: number;
  categorieID?: number;
};
