export const StructureOrganisationnelleType = {
  AGENCE: 'AGENCE',
  DIRECTION: 'DIRECTION',
} as const;
export type StructureOrganisationnelleType =
  (typeof StructureOrganisationnelleType)[keyof typeof StructureOrganisationnelleType];

export type ReadStructureOrganisationnelle = {
  id: string;
  structureOrganisationnelleType: StructureOrganisationnelleType;
};

export type ReadStructureName = {
  id: string;
  structureOrganisationnelleType: StructureOrganisationnelleType;
  nomAgence: string | null;
  nomDirection: string | null;
};

export type CreateStructureOrganisationnelle = ReadStructureOrganisationnelle;

export type UpdateStructureOrganisationnelle = Partial<
  Omit<CreateStructureOrganisationnelle, 'id'>
>;
