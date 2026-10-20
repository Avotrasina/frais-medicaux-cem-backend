import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service.js";
import type {
  Personne,
  Agent,
  Prisma,
} from "../../../generated/prisma/client.js";
import type { DbClient } from "../../../infrastructure/prisma/db-client.type.js";
import {
  AgentType,
  StatutPEC,
  type CreateAgent,
  type ReadAgent,
  type ReadPersonneAgent,
  type UpdatePartialAgent,
} from "../types/agent.types.js";
import { type ReadPersonne, Sexe } from "../../personne/personne.types.js";
import { HandlePrismaErrors } from "../../../common/decorators/handle-prisma-errors.decorator.js";
import { omitNullish } from "../../../common/utils/omit-nullish.js";

type AgentWithPersonne = Prisma.AgentGetPayload<{
  include: { personne: true };
}>;

@Injectable()
@HandlePrismaErrors({
  exclude: ["toReadAgent", "toReadPersonne", "toReadPersonneAgent"],
})
export class AgentRepository {
  constructor(private readonly prisma: PrismaService) {}

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
      statutPEC: StatutPEC[agent.statutPEC],
      agentType: AgentType[agent.agentType],
      structureID: agent.structureID,
      codeService: agent.serviceID,
      fonction: agent.fonction,
      categorieID: agent.categorieID,
    };
  }

  private toReadPersonneAgent(a: AgentWithPersonne): ReadPersonneAgent {
    const { personne, ...agent } = a;
    return {
      ...this.toReadPersonne(personne),
      agent: this.toReadAgent(agent),
    };
  }

  private async findManyWithPersonne(
    where: Prisma.AgentWhereInput,
    tx?: DbClient,
  ): Promise<ReadPersonneAgent[]> {
    const agents = await this.client(tx).agent.findMany({
      where,
      include: { personne: true },
      orderBy: [{ personne: { nom: "asc" } }, { personne: { prenom: "asc" } }],
    });
    return agents.map((a) => this.toReadPersonneAgent(a));
  }


  async findAll(tx?: DbClient): Promise<ReadAgent[]> {
    const agents = await this.client(tx).agent.findMany();
    return agents.map((agent) => this.toReadAgent(agent));
  }

  async findByID(id: number, tx?: DbClient): Promise<ReadAgent> {
    const agent = await this.client(tx).agent.findUniqueOrThrow({
      where: { id },
    });
    return this.toReadAgent(agent);
  }

  async findByLastNameWithPersonne(
    lastName: string,
    tx?: DbClient,
  ): Promise<ReadPersonneAgent[]> {
    const value = lastName.trim();
    if (!value) return [];

    return this.findManyWithPersonne(
      { personne: { nom: { contains: value, mode: "insensitive" } } },
      tx,
    );
  }

  async findByFirstNameWithPersonne(
    firstName: string,
    tx?: DbClient,
  ): Promise<ReadPersonneAgent[]> {
    const value = firstName.trim();
    if (!value) return [];

    return this.findManyWithPersonne(
      { personne: { prenom: { contains: value, mode: "insensitive" } } },
      tx,
    );
  }

  async findByIDWithPersonne(
    id: number,
    tx?: DbClient,
  ): Promise<ReadPersonneAgent> {
    const agent = await this.client(tx).agent.findUniqueOrThrow({
      where: { id },
      include: { personne: true },
    });
    return this.toReadPersonneAgent(agent);
  }

  async findByMatricule(
    matricule: number,
    tx?: DbClient,
  ): Promise<ReadAgent> {
    const agent = await this.client(tx).agent.findUniqueOrThrow({
      where: { matricule },
    });
    return this.toReadAgent(agent)
  }

  async findByMatriculeWithPersonne(
    matricule: number,
    tx?: DbClient,
  ):Promise<ReadPersonneAgent>{
    const agent = await this.client(tx).agent.findUniqueOrThrow({
      where: { matricule },
      include:{personne:true}
    });
    return this.toReadPersonneAgent(agent)
  }

  async findAllAgents(tx?: DbClient): Promise<ReadPersonneAgent[]> {
    return this.findManyWithPersonne({}, tx);
  }

  async findAllRetiredAgents(tx?: DbClient): Promise<ReadPersonneAgent[]> {
    return this.findManyWithPersonne({ agentType: "AGENT_RETRAITE" }, tx);
  }

  async findAgentsWithPrsonneByCodeAgence(
    codeAgence: string,
    tx?: DbClient,
  ): Promise<ReadPersonneAgent[]> {
    return this.findManyWithPersonne({ structureID: codeAgence }, tx);
  }

  async findAgentsWithPersonneByDirection(
    directionID: string,
    serviceID?: string | null,
    tx?: DbClient,
  ): Promise<ReadPersonneAgent[]> {
    return this.findManyWithPersonne(
      {
        structureID: directionID,
        structureOrganisationnelle: {
          is: { structureOrganisationnelleType: "DIRECTION" },
        },
        ...(serviceID != null && { serviceID }),
      },
      tx,
    );
  }

  async findAgentCard(agentMatricule: number,tx?:DbClient):Promise<string>{
    const agent  = await this.client(tx).agent.findFirstOrThrow(
      {
        where:{
          matricule:agentMatricule
        }
      }
    )
    return agent.carteProfessionnellePath;
  }


  async create(agent: CreateAgent, tx?: DbClient): Promise<ReadAgent> {
    const created = await this.client(tx).agent.create({ data: agent });
    return this.toReadAgent(created);
  }

  async updatePartial(
    id: number,
    agent: UpdatePartialAgent,
    tx?: DbClient,
  ): Promise<ReadAgent> {
    const structureID =agent.structureID;

    const data = omitNullish({
      observationMatricule: agent.observationMatricule,
      dateEntree: agent.dateEntree,
      statutPEC: agent.statutPEC,
      agentType: agent.agentType,
      structureID,
      serviceID: agent.codeService,
      fonction: agent.fonction,
      categorieID: agent.categorieID,
    });

    const updated = await this.client(tx).agent.update({
      where: { id },
      data,
    });
    return this.toReadAgent(updated);
  }

  async updateProfCard(
    id: number,
    newCardPath: string,
    tx?: DbClient,
  ): Promise<ReadAgent> {
    const updated = await this.client(tx).agent.update({
      where: { id },
      data: { carteProfessionnellePath: newCardPath },
    });
    return this.toReadAgent(updated);
  }

  async updateStructureByService(
    serviceID: string,
    structureID: string,
    tx?: DbClient,
  ): Promise<number> {
    const result = await this.client(tx).agent.updateMany({
      where: { serviceID },
      data: { structureID },
    });
    return result.count;
  }

  async delete(id: number, tx?: DbClient): Promise<void> {
    await this.client(tx).agent.delete({ where: { id } });
  }
}
