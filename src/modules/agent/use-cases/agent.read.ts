import { Injectable } from "@nestjs/common";
import { AgentRepository } from "../repositories/agent.repository.js";
import { AgentType } from "../types/agent.types.js";
import type { AgentUseCaseTypes,FilterOptions} from "../types/use-case.agent.types.js";
import { BackOfficeFrontOffice } from "../dtos/enum.js";

type PersonneAgent = Awaited<
  ReturnType<AgentRepository["findAllAgents"]>
>[number];

@Injectable()
export class ReadAgentUseCase {
  constructor(private readonly agentRepository: AgentRepository) {}

  private async fetch(
    query: () => Promise<PersonneAgent[]>,
  ): Promise<AgentUseCaseTypes[]> {
    const agents = await query();
    return agents.map((a) => this.toUseCaseType(a));
  }

  private toUseCaseType({
    agent,
    id: _p,
    ...personne
  }: PersonneAgent): AgentUseCaseTypes {
    const { structureID: _s, id: _a, agentType, ...resteAgent } = agent;

    return {
      ...personne,
      ...resteAgent,
      backOfficeFrontOffice: this.resolveBackOffice(
        agentType,
        resteAgent.codeDirection,
      ),
    };
  }

  private resolveBackOffice(
    agentType: AgentType,
    codeDirection?: string | null,
  ): BackOfficeFrontOffice {
    if (agentType === AgentType.AGENT_RETRAITE) {
      return BackOfficeFrontOffice.RETRAITE;
    }
    return codeDirection
      ? BackOfficeFrontOffice.DIRECTION
      : BackOfficeFrontOffice.AGENCE;
  }
  readAll(): Promise<AgentUseCaseTypes[]> {
    return this.fetch(() => this.agentRepository.findAllAgents());
  }

  filter(params: FilterOptions): Promise<AgentUseCaseTypes[]> {
    const { backOfficeFrontOffice, codeAgence, codeDirection, codeService } =
      params;

    if (backOfficeFrontOffice === BackOfficeFrontOffice.RETRAITE) {
      return this.fetch(() => this.agentRepository.findAllRetiredAgents());
    }
    if (codeAgence != null) {
      return this.fetch(() =>
        this.agentRepository.findAgentsByCodeAgence(codeAgence),
      );
    }
    if (codeDirection != null) {
      return this.fetch(() =>
        this.agentRepository.findAgentsByDirection(codeDirection, codeService),
      );
    }
    return this.readAll();
  }

}