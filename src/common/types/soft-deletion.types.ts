export type DeletionAction =
  'requestDeletion' | 'validateDeletion' | 'rejectDeletion';

export type DeletionNode = {
  model: string;
  where: Record<string, unknown>;
};
