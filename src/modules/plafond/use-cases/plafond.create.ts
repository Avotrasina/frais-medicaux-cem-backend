import { Injectable } from '@nestjs/common';
import {
  PorteePlafond,
  UnitePlafond,
} from '../../../generated/prisma/enums.js';
import type { DbClient } from '../../../infrastructure/prisma/db-client.type.js';
import { PlafondRepository } from '../repositories/plafond.repository.js';
import type { CreatePlafond, ReadPlafond } from '../types/plafond.types.js';
import { validatePlafond } from './plafond.validation.js';

type CompleteCreatePlafond = {
  dateEffet?: string;
  porteePlafond: PorteePlafond;
  unite: UnitePlafond;
  montant: number | null;
  nbSeances: number | null;
  acteID: number | null;
  categorieActeID: number | null;
};

@Injectable()
export class CreatePlafondUseCase {
  constructor(private readonly plafondRepository: PlafondRepository) {}

  async execute(input: CreatePlafond, tx?: DbClient): Promise<ReadPlafond> {
    const plafond: CompleteCreatePlafond = {
      dateEffet: input.dateEffet,
      porteePlafond: input.porteePlafond ?? PorteePlafond.PAR_ACTE,
      unite: input.unite ?? UnitePlafond.MONTANT,
      montant: input.montant ?? null,
      nbSeances: input.nbSeances ?? null,
      acteID: input.acteID ?? null,
      categorieActeID: input.categorieActeID ?? null,
    };
    validatePlafond(plafond);
    return this.plafondRepository.create(plafond, tx);
  }
}
