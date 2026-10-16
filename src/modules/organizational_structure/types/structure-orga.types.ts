import type { Prisma } from "../../../generated/prisma/client.js";

export const StructureOrganisationnelleType = {
  AGENCE: "AGENCE",
  DIRECTION: "DIRECTION",
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
  Omit<CreateStructureOrganisationnelle, "id">
>;

// Relations à charger avec la structure, et type du résultat correspondant
export const STRUCTURE_WITH_NAMES_INCLUDE = {
  agence: true,
  direction: true,
} as const satisfies Prisma.StructureOrganisationnelleInclude;

export type StructureWithNames = Prisma.StructureOrganisationnelleGetPayload<{
  include: typeof STRUCTURE_WITH_NAMES_INCLUDE;
}>;