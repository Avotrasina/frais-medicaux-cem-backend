// famille.agent.types.ts
import type { Prisma } from "../../../generated/prisma/client.js";
import type { Sexe } from "../../personne/personne.types.js";

export type PersonneData = {
  nom: string;
  prenom: string;
  dateNaissance: Date;
  sexe: Sexe;
};

export type CreateFamilleAgentBase = {
  agentMatricule: string;
  carteSocialePath: string;
  personne: PersonneData;
};

export type UpdatePartialFamilleAgentBase = {
  personne?: Partial<PersonneData>;
};

const familleInclude = {
  personne: true,
  conjoint: true,
  enfant: true,
} satisfies Prisma.FamilleAgentInclude;

export const FAMILLE_AGENT_INCLUDE = familleInclude;

export type ReadFamilleAgent = Prisma.FamilleAgentGetPayload<{
  include: typeof familleInclude;
}>;