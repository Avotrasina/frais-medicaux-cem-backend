import { Prisma } from "../../../generated/prisma/client.js";
import type {
  CreateAgentFamilyBase,
  UpdatePartialAgentFamilyBase,
} from "./agent-family.types.js";

export type CreateConjoint = CreateAgentFamilyBase;
export type UpdatePartialConjoint = UpdatePartialAgentFamilyBase;
export type ReadConjoint = {
  id: number;
  numConjoint: number;
  agentMatricule: string;
  carteSocialePath: string;
};
export type CreatedConjoint = {
  id: number;
  numConjoint: number;
};
export type ConjointWithFamilleAgentPersonne = Prisma.ConjointGetPayload<{
  include: { familleAgent: { include: { personne: true } } };
}>;

export type CreateConjointRecord = Omit<CreateConjoint, "personne"> & { id: number };
