// famille.agent.types.ts
import type { Prisma } from "../../../generated/prisma/client.js";
import type { Sexe } from "../../personne/personne.types.js";
import type { Readable } from "node:stream";

export type PersonneData = {
  nom: string;
  prenom: string;
  dateNaissance: Date;
  sexe: Sexe;
};

export type CreateAgentFamilyBase = {
  agentMatricule: string;
  carteSocialePath: string;
  personne: PersonneData;
};

export type UpdatePartialAgentFamilyBase = {
  personne?: Partial<PersonneData>;
};

export type ReadAgentFamily = {
  id:number,
  nom:string,
  prenom:string,
  dateNaissance:Date,
  sexe:Sexe,
  numConjoint?: number | null,
  numEnfant?:number | null,
  carteSocialPath:string,
  agentMatricule:string
}

const FamilyInclude = {
  personne: true,
  conjoint: true,
  enfant: true,
} satisfies Prisma.FamilleAgentInclude;

export const FAMILLE_AGENT_INCLUDE = FamilyInclude;

export type ReadAgentFamilyDB = Prisma.FamilleAgentGetPayload<{
  include: typeof FamilyInclude;
}>;

export type AgentCardFile = {
  stream: Readable;
  mimeType: string;
  fileName: string;
};