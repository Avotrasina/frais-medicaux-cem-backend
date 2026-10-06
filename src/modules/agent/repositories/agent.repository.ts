import { Injectable } from "@nestjs/common";
import { PrismaClient } from "../../../generated/prisma/client.js";
import type {
  Personne,
  Agent,
  Prisma,
} from "../../../generated/prisma/client.js";
import type { DbClient } from "../../../common/prisma/db-client.type.js";
import {
  AgentType,StatutPEC,
  type CreateAgent,
  type ReadAgent,
  type UpdateAgent,
} from "../types/agent.types.js";
import {type ReadPersonne,Sexe} from "../types/personne.types.js"
import { HandlePrismaErrors } from "../../../common/decorators/handle-prisma-errors.decorator.js";
import type {ReadPersonneAgent} from "../types/agent.types.js"

type PersonneWithAgent = Prisma.PersonneGetPayload<{
  include: { agent: true };
}>;

@Injectable()
@HandlePrismaErrors({exclude: ["toReadAgent"] })
export class AgentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private toReadPersonne(personne: Personne): ReadPersonne {
    return { ...personne, sexe: Sexe[personne.sexe] };
  }
  private toReadAgent(agent: Agent): ReadAgent {
    return {
      id: agent.id,
      matricule: agent.matricule,
      observationMatricule: agent.observationMatricule,
      carteProfessionnellePath: agent.carteProfessionnellePath,
      dateEntree: agent.dateEntree,
      statutPEC:StatutPEC[agent.statutPEC],
      agentType: AgentType[agent.agentType],
      structureID: agent.structureID,
      codeService: agent.serviceID,
      fonctionID: agent.fonctionID,
      categorieID: agent.categorieID,
    };
  }
  private toReadPersonneAgent(
    p: PersonneWithAgent & { agent: Agent },
  ): ReadPersonneAgent {
    const { agent, ...personne } = p;
    return {
      ...this.toReadPersonne(personne),
      agent: this.toReadAgent(agent),
    };
  }

  async findAll(tx?: DbClient): Promise<ReadAgent[]> {
    const agents = await this.client(tx).agent.findMany();
    return agents.map((agent) => this.toReadAgent(agent));
  }

  async findOne(id: number, tx?: DbClient): Promise<ReadAgent | null> {
    const agent = await this.client(tx).agent.findUnique({ where: { id } });
    return agent ? this.toReadAgent(agent) : null;
  }

  async findAllAgents(tx?: DbClient): Promise<ReadPersonneAgent[]> {
    const personnes = await this.client(tx).personne.findMany({
      where: { agent: { isNot: null } }, 
      include: { agent: true },
      orderBy: { nom: "asc" },
    });

    return personnes
      .filter(
        (p): p is PersonneWithAgent & { agent: Agent } => p.agent !== null,
      )
      .map((p) => this.toReadPersonneAgent(p));
  } 

  async findAllRetiredAgents(tx?: DbClient): Promise<ReadPersonneAgent[]> {
    const personnes = await this.client(tx).personne.findMany({
      where: { agent: { is: { agentType: "AGENT_RETRAITE" } } },
      include: { agent: true },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    });

    return personnes
      .filter(
        (p): p is PersonneWithAgent & { agent: Agent } => p.agent !== null,
      )
      .map((p) => this.toReadPersonneAgent(p));
  }

  async findAgentsByCodeAgence(
    codeAgence: string,
    tx?: DbClient,
  ): Promise<ReadPersonneAgent[]> {
    const personnes = await this.client(tx).personne.findMany({
      where: { agent: { is: { structureID: codeAgence } } },
      include: { agent: true },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    });

    return personnes
      .filter(
        (p): p is PersonneWithAgent & { agent: Agent } => p.agent !== null,
      )
      .map((p) => this.toReadPersonneAgent(p));
  }

  async findAgentsByDirection(
    directionID: string,
    serviceID?: string | null,
    tx?: DbClient,
  ): Promise<ReadPersonneAgent[]> {
    const personnes = await this.client(tx).personne.findMany({
      where: {
        agent: {
          is: {
            structureID: directionID,
            structureOrganisationnelle: {
              is: { structureOrganisationnelleType: "DIRECTION" },
            },
            ...(serviceID != null && { serviceID }),
          },
        },
      },
      include: { agent: true },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    });

    return personnes
      .filter(
        (p): p is PersonneWithAgent & { agent: Agent } => p.agent !== null,
      )
      .map((p) => this.toReadPersonneAgent(p));
  }

  async findByMatricule(
    matricule: string,
    tx?: DbClient,
  ): Promise<ReadAgent | null> {
    const agent = await this.client(tx).agent.findUnique({
      where: { matricule },
    });
    return agent ? this.toReadAgent(agent) : null;
  }

  async create(agent: CreateAgent, tx?: DbClient): Promise<ReadAgent> {
    const created = await this.client(tx).agent.create({ data: agent });
    return this.toReadAgent(created);
  }

  async update(
    id: number,
    agent: UpdateAgent,
    tx?: DbClient,
  ): Promise<ReadAgent> {
    const updated = await this.client(tx).agent.update({
      where: { id },
      data: agent,
    });
    return this.toReadAgent(updated);
  }

  async delete(id: number, tx?: DbClient): Promise<void> {
    await this.client(tx).agent.delete({ where: { id } });
  }
}