import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import type { DbClient } from '../../../infrastructure/prisma/db-client.type.js';
import {
  type CreateAgent,
  type ReadAgent,
  type ReadPersonneAgent,
  type UpdatePartialAgent,
} from '../types/agent.types.js';
import { HandlePrismaErrors } from '../../../common/decorators/handle-prisma-errors.decorator.js';
import { omitNullish } from '../../../common/utils/omit-nullish.js';
import { executeSoftDeletion } from '../../../infrastructure/prisma/soft-deletion.repository.js';
import type {
  DeletionAction,
  DeletionNode,
} from '../../../common/types/soft-deletion.types.js';
import { SuppresionStatut } from '../../../generated/prisma/enums.js';
import {
  mapAgentToRead,
  mapAgentWithPersonneToRead,
} from '../mappers/agent.mapper.js';

type AgentPersonDeletionData = {
  id: number;
  beneficiaire: {
    id: number;
    attestations: { id: number }[];
  } | null;
};

type AgentFamilyDeletionData = {
  id: number;
  carteSocialePath: string;
  conjoint: { id: number } | null;
  enfant: { id: number } | null;
  personne: AgentPersonDeletionData;
};

type AgentDeletionData = {
  id: number;
  matricule: number;
  carteProfessionnellePath: string;
  personne: AgentPersonDeletionData;
  familleAgent: AgentFamilyDeletionData[];
};

@Injectable()
@HandlePrismaErrors()
export class AgentRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private async findManyWithPersonne(
    where: Prisma.AgentWhereInput,
    tx?: DbClient,
  ): Promise<ReadPersonneAgent[]> {
    const agents = await this.client(tx).agent.findMany({
      where,
      include: { personne: true },
      orderBy: [{ personne: { nom: 'asc' } }, { personne: { prenom: 'asc' } }],
    });
    return agents.map(mapAgentWithPersonneToRead);
  }

  async findAll(tx?: DbClient): Promise<ReadAgent[]> {
    const agents = await this.client(tx).agent.findMany();
    return agents.map(mapAgentToRead);
  }

  async findById(id: number, tx?: DbClient): Promise<ReadAgent> {
    const agent = await this.client(tx).agent.findFirstOrThrow({
      where: { id },
    });
    return mapAgentToRead(agent);
  }

  async findByLastNameWithPersonne(
    lastName: string,
    tx?: DbClient,
  ): Promise<ReadPersonneAgent[]> {
    const value = lastName.trim();
    if (!value) return [];

    return this.findManyWithPersonne(
      { personne: { nom: { contains: value, mode: 'insensitive' } } },
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
      { personne: { prenom: { contains: value, mode: 'insensitive' } } },
      tx,
    );
  }

  async findByIdWithPersonne(
    id: number,
    tx?: DbClient,
  ): Promise<ReadPersonneAgent> {
    const agent = await this.client(tx).agent.findFirstOrThrow({
      where: { id },
      include: { personne: true },
    });
    return mapAgentWithPersonneToRead(agent);
  }

  async findByMatricule(matricule: number, tx?: DbClient): Promise<ReadAgent> {
    const agent = await this.client(tx).agent.findFirstOrThrow({
      where: { matricule },
    });
    return mapAgentToRead(agent);
  }

  async findByMatriculeWithPersonne(
    matricule: number,
    tx?: DbClient,
  ): Promise<ReadPersonneAgent> {
    const agent = await this.client(tx).agent.findFirstOrThrow({
      where: { matricule },
      include: { personne: true },
    });
    return mapAgentWithPersonneToRead(agent);
  }

  /**
   * Applies a deletion request to the agent and its dependencies, then returns
   * the card paths to remove from storage.
   */
  async applyDeletionTree(
    matricule: number,
    action: DeletionAction,
    tx?: DbClient,
  ): Promise<string[]> {
    const client = this.client(tx) as any;
    const agent = (await client.agent.findFirstOrThrow({
      where: { matricule },
      select: {
        id: true,
        matricule: true,
        carteProfessionnellePath: true,
        personne: {
          select: {
            id: true,
            beneficiaire: {
              select: { id: true, attestations: { select: { id: true } } },
            },
          },
        },
        familleAgent: {
          select: {
            id: true,
            carteSocialePath: true,
            conjoint: { select: { id: true } },
            enfant: { select: { id: true } },
            personne: {
              select: {
                id: true,
                beneficiaire: {
                  select: { id: true, attestations: { select: { id: true } } },
                },
              },
            },
          },
        },
      },
    })) as AgentDeletionData;

    await executeSoftDeletion(client, this.deletionNodes(agent), action);
    return [
      agent.carteProfessionnellePath,
      ...agent.familleAgent.map(({ carteSocialePath }) => carteSocialePath),
    ];
  }

  /** Builds deletion targets for the agent and their family members. */
  private deletionNodes(agent: AgentDeletionData): DeletionNode[] {
    const nodes: DeletionNode[] = [
      { model: 'agent', where: { matricule: agent.matricule } },
      ...this.personDeletionNodes(agent.personne),
    ];
    for (const family of agent.familleAgent) {
      nodes.push({ model: 'familleAgent', where: { id: family.id } });
      if (family.conjoint)
        nodes.push({ model: 'conjoint', where: { id: family.conjoint.id } });
      if (family.enfant)
        nodes.push({ model: 'enfant', where: { id: family.enfant.id } });
      nodes.push(...this.personDeletionNodes(family.personne));
    }
    return nodes;
  }

  /** Adds the person, optional beneficiary, and attestations to the deletion tree. */
  private personDeletionNodes(
    person: AgentDeletionData['personne'],
  ): DeletionNode[] {
    const nodes: DeletionNode[] = [
      { model: 'personne', where: { id: person.id } },
    ];
    if (!person.beneficiaire) return nodes;
    nodes.push({
      model: 'beneficiaire',
      where: { id: person.beneficiaire.id },
    });
    nodes.push(
      ...person.beneficiaire.attestations.map(({ id }) => ({
        model: 'attestation',
        where: { id },
      })),
    );
    return nodes;
  }

  async findAllAgents(tx?: DbClient): Promise<ReadPersonneAgent[]> {
    return this.findManyWithPersonne({}, tx);
  }

  async findDeletionRequests(tx?: DbClient): Promise<ReadPersonneAgent[]> {
    return this.findManyWithPersonne(
      { suppressionStatut: SuppresionStatut.EN_ATTENTE },
      tx,
    );
  }

  async findAllRetiredAgents(tx?: DbClient): Promise<ReadPersonneAgent[]> {
    return this.findManyWithPersonne({ agentType: 'AGENT_RETRAITE' }, tx);
  }

  async findAgentsByAgencyCode(
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
          is: { structureOrganisationnelleType: 'DIRECTION' },
        },
        ...(serviceID != null && { serviceID }),
      },
      tx,
    );
  }

  async findAgentCard(agentMatricule: number, tx?: DbClient): Promise<string> {
    const agent = await this.client(tx).agent.findFirstOrThrow({
      where: {
        matricule: agentMatricule,
      },
    });
    return agent.carteProfessionnellePath;
  }

  async create(agent: CreateAgent, tx?: DbClient): Promise<ReadAgent> {
    const created = await this.client(tx).agent.create({ data: agent });
    return mapAgentToRead(created);
  }

  async updatePartial(
    id: number,
    agent: UpdatePartialAgent,
    tx?: DbClient,
  ): Promise<ReadAgent> {
    const structureID = agent.structureID;

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
    return mapAgentToRead(updated);
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
    return mapAgentToRead(updated);
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
