import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { DbClient } from '../../../infrastructure/prisma/db-client.type.js';
import { executeSoftDeletion } from '../../../infrastructure/prisma/soft-deletion.repository.js';
import type {
  DeletionAction,
  DeletionNode,
} from '../../../common/types/soft-deletion.types.js';
import type { ProviderDeletionRoot } from '../types/provider-tree-deletion.types.js';

type ProviderDeletionData = {
  id: number;
  conventionPath: string;
  attestations: { id: number }[];
};

@Injectable()
export class ProviderDeletionRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  /**
   * Applies the action to the root (provider, location, or category), its
   * providers, and their attestations, then returns the affected files.
   */
  async applyTreeDeletion(
    rootModel: ProviderDeletionRoot,
    id: number,
    action: DeletionAction,
    tx?: DbClient,
  ): Promise<string[]> {
    const client = this.client(tx) as any;
    const providers = await this.findProviders(rootModel, id, client);
    await executeSoftDeletion(
      client,
      this.deletionNodes(rootModel, id, providers),
      action,
    );
    return providers.map(({ conventionPath }) => conventionPath);
  }

  /** Loads providers directly or through the root entity relation. */
  private async findProviders(
    rootModel: ProviderDeletionRoot,
    id: number,
    client: any,
  ): Promise<ProviderDeletionData[]> {
    const providerSelect = {
      id: true,
      conventionPath: true,
      attestations: { select: { id: true } },
    };
    if (rootModel === 'prestataire') {
      const provider = await client.prestataire.findFirstOrThrow({
        where: { id },
        select: providerSelect,
      });
      return [provider as ProviderDeletionData];
    }

    const root = await client[rootModel].findFirstOrThrow({
      where: { id },
      select: { prestataires: { select: providerSelect } },
    });
    return root.prestataires as ProviderDeletionData[];
  }

  /** Enumerates the root, child providers, and their attestations. */
  private deletionNodes(
    rootModel: ProviderDeletionRoot,
    id: number,
    providers: ProviderDeletionData[],
  ): DeletionNode[] {
    const nodes: DeletionNode[] = [{ model: rootModel, where: { id } }];
    for (const provider of providers) {
      nodes.push({ model: 'prestataire', where: { id: provider.id } });
      nodes.push(
        ...provider.attestations.map(({ id: attestationId }) => ({
          model: 'attestation',
          where: { id: attestationId },
        })),
      );
    }
    return nodes;
  }
}
