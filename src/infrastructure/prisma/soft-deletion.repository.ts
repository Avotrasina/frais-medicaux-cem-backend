import type {
  DeletionAction,
  DeletionNode,
} from '../../common/types/soft-deletion.types.js';

/**
 * Applies the same deletion action to every target in the tree, using the
 * transaction client supplied by the caller.
 */
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
