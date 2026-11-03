import { Injectable } from '@nestjs/common';
import { PlafondRepository } from '../repositories/plafond.repository.js';
import type { ReadPlafond, UpdatePlafond } from '../types/plafond.types.js';
import { validatePlafond } from './plafond.validation.js';

@Injectable()
export class UpdatePlafondUseCase {
  constructor(private readonly plafondRepository: PlafondRepository) {}

  async execute(id: number, input: UpdatePlafond): Promise<ReadPlafond> {
    const plafond = await this.plafondRepository.findById(id);
    const updatedPlafond = {
      porteePlafond: input.porteePlafond ?? plafond.porteePlafond,
      dateEffet: input.dateEffet ?? plafond.dateEffet,
      dateFin: input.dateFin === undefined ? plafond.dateFin : input.dateFin,
      unite: input.unite ?? plafond.unite,
      montant:
        input.montant === undefined
          ? plafond.montant
          : input.montant === null
            ? null
            : String(input.montant),
      nbSeances:
        input.nbSeances === undefined ? plafond.nbSeances : input.nbSeances,
      acteID: input.acteID === undefined ? plafond.acteID : input.acteID,
      categorieActeID:
        input.categorieActeID === undefined
          ? plafond.categorieActeID
          : input.categorieActeID,
    };

    validatePlafond(updatedPlafond);
    if (Object.keys(input).length === 0) {
      return plafond;
    }
    return this.plafondRepository.update(id, input);
  }
}
