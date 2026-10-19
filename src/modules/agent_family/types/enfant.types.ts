import type {
  CreateAgentFamilyBase,
  UpdatePartialAgentFamilyBase,
} from "./agent-family.types.js";
import { Prisma } from "../../../generated/prisma/client.js";

export type CreateEnfant = CreateAgentFamilyBase;
export type UpdatePartialEnfant = UpdatePartialAgentFamilyBase;
export type ReadEnfant = {
  id: number;
  numEnfant: number;
  agentMatricule: number;
  carteSocialePath: string;
};

export type CreatedEnfantWithAgentFamilyAttribute = Prisma.EnfantGetPayload<{
  include:{familleAgent:true};
}>;

export type EnfantWithAgentFamilyPersonne = Prisma.EnfantGetPayload<{
  include: { familleAgent: { include: { personne: true } } };
}>;

export type CreateEnfantRecord = Omit<CreateEnfant, "personne"> & { id: number };
