import type { CreateAgence } from './agence.types.js';

/* ---------- Agence ---------- */
export type CreateAgenceUseCaseInput = CreateAgence;
export type UpdateAgenceUseCaseInput = CreateAgence;

/* ---------- Direction ---------- */
export type CreateDirectionUseCaseInput = {
  codeDirection: string;
  nomDirection: string;
};
export type UpdateDirectionUseCaseInput = CreateDirectionUseCaseInput;

/* ---------- Service ---------- */
export type CreateServiceUseCaseInput = {
  codeService: string;
  nomService: string;
  codeDirection: string;
};

export type UpdateServiceNomUseCaseInput = Pick<
  CreateServiceUseCaseInput,
  'codeService' | 'nomService'
>;

export type UpdateServiceCodeDirectionUseCaseInput = Pick<
  CreateServiceUseCaseInput,
  'codeService' | 'codeDirection'
>;

export type ReadServicesByDirectionUseCaseInput = {
  codeDirection: string;
};
