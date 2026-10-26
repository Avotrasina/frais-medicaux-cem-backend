import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { DbClient } from '../../../infrastructure/prisma/db-client.type.js';
import { executeSoftDeletion } from '../../../infrastructure/prisma/soft-deletion.repository.js';
import type {
  DeletionAction,
  DeletionNode,
} from '../../../common/types/soft-deletion.types.js';
import type { OrganizationalDeletionTarget } from '../types/structure-deletion.types.js';

@Injectable()
export class StructureDeletionRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  async applyTreeDeletion(
    target: OrganizationalDeletionTarget,
    id: string,
    action: DeletionAction,
    tx?: DbClient,
  ): Promise<void> {
    const client = this.client(tx) as any;
    const nodes = await this.deletionNodes(target, id, client);
    await executeSoftDeletion(client, nodes, action);
    if (action !== 'validateDeletion') return;

    if (target === 'service') {
      await client.agent.updateMany({
        where: { serviceID: id },
        data: { serviceID: null },
      });
    } else if (target === 'agence') {
      await client.agent.updateMany({
        where: { structureID: id },
        data: { structureID: null },
      });
    } else {
      const serviceCodes = nodes
        .filter((node) => node.model === 'service')
        .map((node) => node.where.codeService);
      await client.agent.updateMany({
        where: { serviceID: { in: serviceCodes } },
        data: { serviceID: null },
      });
      await client.agent.updateMany({
        where: { structureID: id },
        data: { structureID: null },
      });
    }
  }

  private async deletionNodes(
    target: OrganizationalDeletionTarget,
    id: string,
    client: any,
  ): Promise<DeletionNode[]> {
    if (target === 'service') {
      await client.service.findFirstOrThrow({
        where: { codeService: id },
        select: { codeService: true },
      });
      return [{ model: 'service', where: { codeService: id } }];
    }

    if (target === 'agence') {
      await client.agence.findFirstOrThrow({
        where: { codeAgence: id },
        select: { codeAgence: true },
      });
      await client.structureOrganisationnelle.findFirstOrThrow({
        where: { id },
        select: { id: true },
      });
      return [
        { model: 'agence', where: { codeAgence: id } },
        { model: 'structureOrganisationnelle', where: { id } },
      ];
    }

    const direction = await client.direction.findFirstOrThrow({
      where: { codeDirection: id },
      select: { services: { select: { codeService: true } } },
    });
    await client.structureOrganisationnelle.findFirstOrThrow({
      where: { id },
      select: { id: true },
    });
    return [
      { model: 'direction', where: { codeDirection: id } },
      ...direction.services.map((service: { codeService: string }) => ({
        model: 'service',
        where: { codeService: service.codeService },
      })),
      { model: 'structureOrganisationnelle', where: { id } },
    ];
  }
}
