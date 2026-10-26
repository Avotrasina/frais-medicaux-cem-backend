import { Prisma } from "../../../generated/prisma/client.js";
import type {
  CreateAgentFamilyBase,
  UpdatePartialAgentFamilyBase,
} from "./agent-family.types.js";
import type { Sexe } from "../../personne/personne.types.js";

export type CreateConjoint = CreateAgentFamilyBase;
export type UpdatePartialConjoint = UpdatePartialAgentFamilyBase;
export type ReadConjoint = {
  id: number;
  nom: string;
  prenom: string;
  dateNaissance: Date;
  sexe: Sexe;
  numConjoint: number;
  agentMatricule: number;
  carteSocialePath: string;
};

export type ConjointWitAgentFamilyPersonne = Prisma.ConjointGetPayload<{
  include: { familleAgent: { include: { personne: true } } };
}>;

export type CreatedConjointWithAgentFamily = Prisma.ConjointGetPayload<{
  include:{familleAgent:true}
}>

export type CreateConjointRecord = Omit<CreateConjoint, "personne"> & { id: number };
