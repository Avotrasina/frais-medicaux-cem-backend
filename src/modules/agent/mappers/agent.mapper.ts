import type { Agent, Personne } from '../../../generated/prisma/client.js';
import {
  AgentType,
  StatutPEC,
  type ReadAgent,
  type ReadPersonneAgent,
} from '../types/agent.types.js';
import { Sexe, type ReadPersonne } from '../../personne/personne.types.js';

/** Normalizes the Prisma sex value to the public Personne module enum. */
export function mapPersonneToRead(personne: Personne): ReadPersonne {
  return { ...personne, sexe: Sexe[personne.sexe] };
}

/** Maps Prisma field names and enums to the agent read contract. */
export function mapAgentToRead(agent: Agent): ReadAgent {
  return {
    id: agent.id,
    matricule: agent.matricule,
    observationMatricule: agent.observationMatricule,
    carteProfessionnellePath: agent.carteProfessionnellePath,
    dateEntree: agent.dateEntree,
    statutPEC: StatutPEC[agent.statutPEC],
    agentType: AgentType[agent.agentType],
    structureID: agent.structureID,
    codeService: agent.serviceID,
    fonction: agent.fonction,
    categorieID: agent.categorieID,
  };
}

/** Combines the Personne read contract with the agent loaded by Prisma. */
export function mapAgentWithPersonneToRead(
  agentWithPersonne: Agent & { personne: Personne },
): ReadPersonneAgent {
  const { personne, ...agent } = agentWithPersonne;
  return {
    ...mapPersonneToRead(personne),
    agent: mapAgentToRead(agent),
  };
}
