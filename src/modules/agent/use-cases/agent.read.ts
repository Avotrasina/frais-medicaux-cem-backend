import { Injectable } from '@nestjs/common';
import { AgentRepository } from '../repositories/agent.repository.js';
import { AgentType, type ReadPersonneAgent } from '../types/agent.types.js';
import type {
  AgentUseCaseTypes,
  FilterOptions,
} from '../types/use-case.agent.types.js';
import { BackOfficeFrontOffice } from '../types/agent.enum.types.js';
import { StructureOrganisationnelleRepository } from '../../organizational-structure/repositories/structure-orga.repository.js';

type PersonneAgent = Awaited<
  ReturnType<AgentRepository['findAllAgents']>
>[number];

@Injectable()
export class ReadAgentUseCase {
  constructor(
    private readonly agentRepository: AgentRepository,
    private readonly structureRepository: StructureOrganisationnelleRepository,
  ) {}

  private async fetch(
    query: () => Promise<PersonneAgent[]>,
  ): Promise<AgentUseCaseTypes[]> {
    const agents = await query();
    return Promise.all(agents.map((a) => this.toUseCaseType(a)));
  }

  private async toUseCaseType({
    agent,
    id: _p,
    ...personne
  }: PersonneAgent): Promise<AgentUseCaseTypes> {
    const { structureID, id: _a, agentType, ...resteAgent } = agent;
    const structure =
      structureID && agentType !== AgentType.AGENT_RETRAITE
        ? await this.structureRepository.findById(structureID)
        : null;

    return {
      ...personne,
      ...resteAgent,
      structureID,
      backOfficeFrontOffice: this.resolveBackOffice(agentType, structure),
    };
  }

  /** Determines the front-office from retirement status or the linked structure. */
  private resolveBackOffice(
    agentType: AgentType,
    structure: Awaited<
      ReturnType<StructureOrganisationnelleRepository['findById']>
    > | null,
  ): BackOfficeFrontOffice {
    if (agentType === AgentType.AGENT_RETRAITE) {
      return BackOfficeFrontOffice.RETRAITE;
    }
    if (structure?.nomAgence) return BackOfficeFrontOffice.AGENCE;
    if (structure?.nomDirection) return BackOfficeFrontOffice.DIRECTION;
    return BackOfficeFrontOffice.AGENCE;
  }

  findAll(): Promise<AgentUseCaseTypes[]> {
    return this.fetch(() => this.agentRepository.findAllAgents());
  }

  findDeletionRequests(): Promise<ReadPersonneAgent[]> {
    return this.agentRepository.findDeletionRequests();
  }

  findByFilter(params: FilterOptions): Promise<AgentUseCaseTypes[]> {
    const { backOfficeFrontOffice, codeAgence, codeDirection, codeService } =
      params;

    if (backOfficeFrontOffice === BackOfficeFrontOffice.RETRAITE) {
      return this.fetch(() => this.agentRepository.findAllRetiredAgents());
    }
    if (backOfficeFrontOffice === BackOfficeFrontOffice.AGENCE) {
      return this.fetch(() => this.agentRepository.findAllAgencyAgents());
    }
    if (backOfficeFrontOffice === BackOfficeFrontOffice.DIRECTION) {
      return this.fetch(() => this.agentRepository.findAllDirectionAgents());
    }
    if (codeAgence != null) {
      return this.fetch(() =>
        this.agentRepository.findAgentsByAgencyCode(codeAgence),
      );
    }
    if (codeDirection != null) {
      return this.fetch(() =>
        this.agentRepository.findAgentsWithPersonneByDirection(
          codeDirection,
          codeService,
        ),
      );
    }
    return this.findAll();
  }

  findByLastName(lastName: string): Promise<AgentUseCaseTypes[]> {
    return this.fetch(() =>
      this.agentRepository.findByLastNameWithPersonne(lastName),
    );
  }

  findByFirstName(firstName: string): Promise<AgentUseCaseTypes[]> {
    return this.fetch(() =>
      this.agentRepository.findByFirstNameWithPersonne(firstName),
    );
  }
}
