import type { Sexe } from '../../personne/personne.types.js';
import type { Readable } from 'node:stream';

export type PersonneData = {
  nom: string;
  prenom: string;
  dateNaissance: Date;
  sexe: Sexe;
};

export type CreateAgentFamilyBase = {
  agentMatricule: number;
  carteSocialePath: string;
  personne: PersonneData;
};

export type UpdatePartialAgentFamilyBase = {
  personne?: Partial<PersonneData>;
};

export type ReadAgentFamily = {
  id: number;
  nom: string;
  prenom: string;
  dateNaissance: Date;
  sexe: Sexe;
  numConjoint?: number | null;
  numEnfant?: number | null;
  carteSocialPath: string;
  agentMatricule: number;
};

export type AgentCardFile = {
  stream: Readable;
  mimeType: string;
  fileName: string;
};
