import type {
  CreateAgentFamilyBase,
  UpdatePartialAgentFamilyBase,
} from './agent-family.types.js';
import type { Sexe } from '../../personne/personne.types.js';

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
