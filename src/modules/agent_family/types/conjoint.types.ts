import type {
  CreateFamilleAgentBase,
  UpdatePartialFamilleAgentBase,
} from "./famille.agent.types.js";

export type CreateConjoint = CreateFamilleAgentBase;
export type UpdatePartialConjoint = UpdatePartialFamilleAgentBase;
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