import type {
  CreateFamilleAgentBase,
  UpdatePartialFamilleAgentBase,
} from "./famille.agent.types.js";

export type CreateEnfant = CreateFamilleAgentBase;
export type UpdatePartialEnfant = UpdatePartialFamilleAgentBase;
export type ReadEnfant = {
  id: number;
  numEnfant: number;
  agentMatricule: string;
  carteSocialePath: string;
};
export type CreatedEnfant = {
  id: number;
  numEnfant: number;
};