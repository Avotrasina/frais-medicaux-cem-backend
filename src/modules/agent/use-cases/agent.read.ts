import { Injectable } from "@nestjs/common";
import { AgentRepository } from "../repositories/agent.repository.js";
import { AgentType, type ReadPersonneAgent } from "../types/agent.types.js";
import type { AgentUseCaseTypes,FilterOptions} from "../types/use-case.agent.types.js";
import { BackOfficeFrontOffice } from "../dtos/enum.js";
import { StructureOrganisationnelleRepository } from "../../organizational_structure/repositories/structure-orga.repository.js";

type PersonneAgent = Awaited<
  ReturnType<AgentRepository["findAllAgents"]>
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
  }: PersonneAgent):Promise<AgentUseCaseTypes> {
    const { structureID, id: _a, agentType, ...resteAgent } = agent;
    const structure = structureID && agentType !== AgentType.AGENT_RETRAITE
      ? await this.structureRepository.findByID(structureID)
      : null;

    return {
      ...personne,
      ...resteAgent,
      backOfficeFrontOffice: this.resolveBackOffice(agentType, structure),
    };
  }

  private resolveBackOffice(
    agentType: AgentType,
    structure: Awaited<ReturnType<StructureOrganisationnelleRepository["findByID"]>> | null,
  ): BackOfficeFrontOffice {
    if (agentType === AgentType.AGENT_RETRAITE) {
      return BackOfficeFrontOffice.RETRAITE;
    }
    if (structure?.nomAgence) return BackOfficeFrontOffice.AGENCE;
    if (structure?.nomDirection) return BackOfficeFrontOffice.DIRECTION;
    return BackOfficeFrontOffice.AGENCE;
  }
  
  readAll(): Promise<AgentUseCaseTypes[]> {
    return this.fetch(() => this.agentRepository.findAllAgents());
  }

  readDeletionRequests(): Promise<ReadPersonneAgent[]> {
    return this.agentRepository.findDeletionRequests();
  }

  filter(params: FilterOptions): Promise<AgentUseCaseTypes[]> {
    const { backOfficeFrontOffice, codeAgence, codeDirection, codeService } =
      params;

    if (backOfficeFrontOffice === BackOfficeFrontOffice.RETRAITE) {
      return this.fetch(() => this.agentRepository.findAllRetiredAgents());
    }
    if (codeAgence != null) {
      return this.fetch(() =>
        this.agentRepository.findAgentsWithPrsonneByCodeAgence(codeAgence),
      );
    }
    if (codeDirection != null) {
      return this.fetch(() =>
        this.agentRepository.findAgentsWithPersonneByDirection(codeDirection, codeService),
      );
    }
    return this.readAll();
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
