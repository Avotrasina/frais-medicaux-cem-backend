export const StructureOrganisationnelleType = {
  AGENCE: "AGENCE",
  DIRECTION: "DIRECTION",
} as const;
export type StructureOrganisationnelleType =
  (typeof StructureOrganisationnelleType)[keyof typeof StructureOrganisationnelleType];

export interface ReadStructureOrganisationnelle {
  id: string;
  structureOrganisationnelleType: StructureOrganisationnelleType;
}

export interface CreateStructureOrganisationnelle {
  id: string;
  structureOrganisationnelleType: StructureOrganisationnelleType;
}

export type UpdateStructureOrganisationnelle = Partial<
  Omit<CreateStructureOrganisationnelle, "id">
>;