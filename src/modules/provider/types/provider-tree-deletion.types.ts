export type ProviderDeletionRoot =
  'prestataire' | 'lieu' | 'categoriePrestataire';

export type ProviderDeletionData = {
  id: number;
  conventionPath: string;
  attestations: { id: number }[];
};
