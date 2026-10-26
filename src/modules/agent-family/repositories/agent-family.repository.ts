import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import type { DbClient } from '../../../infrastructure/prisma/db-client.type.js';
import type { ReadAgentFamily } from '../types/agent-family.types.js';
import { HandlePrismaErrors } from '../../../common/decorators/handle-prisma-errors.decorator.js';
import { Sexe } from '../../personne/personne.types.js';
import { executeSoftDeletion } from '../../../infrastructure/prisma/soft-deletion.repository.js';
import type {
  DeletionAction,
  DeletionNode,
} from '../../../common/types/soft-deletion.types.js';
import type { AgentFamilyMemberType } from '../types/agent-family-deletion.types.js';

const FAMILLE_AGENT_INCLUDE = {
  personne: true,
  conjoint: true,
  enfant: true,
} satisfies Prisma.FamilleAgentInclude;

type ReadAgentFamilyRecord = Prisma.FamilleAgentGetPayload<{
  include: typeof FAMILLE_AGENT_INCLUDE;
}>;

type AgentFamilyDeletionData = {
  familleAgent: {
    id: number;
    carteSocialePath: string;
    personne: {
      id: number;
      beneficiaire: { id: number; attestations: { id: number }[] } | null;
    };
  };
};

@Injectable()
@HandlePrismaErrors({ exclude: ['toReadAgentFamily'] })
export class FamilleAgentRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private toReadAgentFamily(
    agentFamily: ReadAgentFamilyRecord,
  ): ReadAgentFamily {
    const family: ReadAgentFamily = {
      id: agentFamily.id,
      nom: agentFamily.personne.nom,
      prenom: agentFamily.personne.prenom,
      dateNaissance: agentFamily.personne.dateNaissance,
      sexe: Sexe[agentFamily.personne.sexe],
      numConjoint: agentFamily.conjoint?.numConjoint ?? null,
      numEnfant: agentFamily.enfant?.numEnfant ?? null,
      carteSocialPath: agentFamily.carteSocialePath,
      agentMatricule: agentFamily.agentMatricule,
    };
    return family;
  }

  async findByAgentMatricule(
    agentMatricule: number,
    tx?: DbClient,
  ): Promise<ReadAgentFamily[]> {
    const agentFamilies = await this.client(tx).familleAgent.findMany({
      where: { agentMatricule },
      include: FAMILLE_AGENT_INCLUDE,
    });
    return agentFamilies.map((agentFamily) => {
      return this.toReadAgentFamily(agentFamily);
    });
  }

  async findCardById(id: number, tx?: DbClient): Promise<string> {
    const AgentFamily = await this.client(tx).familleAgent.findFirstOrThrow({
      where: {
        id,
      },
    });
    return AgentFamily.carteSocialePath;
  }

  /**
   * Applies the action to the selected member and related data, then returns
   * the social card path for storage cleanup after validation.
   */
  async applyMemberDeletion(
    type: AgentFamilyMemberType,
    id: number,
    action: DeletionAction,
    tx?: DbClient,
  ): Promise<string> {
    const client = this.client(tx) as any;
    const data = (await client[type].findFirstOrThrow({
      where: { id },
      select: {
        familleAgent: {
          select: {
            id: true,
            carteSocialePath: true,
            personne: {
              select: {
                id: true,
                beneficiaire: {
                  select: {
                    id: true,
                    attestations: { select: { id: true } },
                  },
                },
              },
            },
          },
        },
      },
    })) as AgentFamilyDeletionData;

    const family = data.familleAgent;
    const nodes: DeletionNode[] = [
      { model: type, where: { id } },
      { model: 'familleAgent', where: { id: family.id } },
      { model: 'personne', where: { id: family.personne.id } },
    ];
    const beneficiary = family.personne.beneficiaire;
    if (beneficiary) {
      nodes.push({ model: 'beneficiaire', where: { id: beneficiary.id } });
      nodes.push(
        ...beneficiary.attestations.map(({ id: attestationId }) => ({
          model: 'attestation',
          where: { id: attestationId },
        })),
      );
    }

    await executeSoftDeletion(client, nodes, action);
    return family.carteSocialePath;
  }
}
