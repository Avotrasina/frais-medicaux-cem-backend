import type { RegimeActe } from '../../../generated/prisma/enums.js';

export type CreateActe = {
  code: string;
  nomActe: string;
  listeLibelle: string;
  regime?: RegimeActe;
  categorieActeId: number;
};

export type UpdateActe = Partial<CreateActe>;

export type ReadActe = {
  id: number;
  code: string;
  nomActe: string;
  listeLibelle: string;
  regime: RegimeActe;
  categorieActeId: number;
};
