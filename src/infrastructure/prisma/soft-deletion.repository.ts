import type {
  DeletionAction,
  DeletionNode,
} from '../../common/types/soft-deletion.types.js';

/** Encapsule les méthodes Prisma ajoutées par l'extension de suppression. */
export async function executeSoftDeletion(
  tx: unknown,
  nodes: DeletionNode[],
  action: DeletionAction,
): Promise<void> {
  const client = tx as any;
  for (const node of nodes) {
    await client[node.model][action](node.where);
  }
}
