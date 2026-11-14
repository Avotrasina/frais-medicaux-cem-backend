import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PorteePlafond } from '../../../generated/prisma/enums.js';
import type { DbClient } from '../../../infrastructure/prisma/db-client.type.js';
import { PlafondRepository } from '../repositories/plafond.repository.js';
import type { ReadPlafond, UpdatePlafond } from '../types/plafond.types.js';
import { validatePlafond } from './plafond.validation.js';

@Injectable()
export class UpdatePlafondUseCase {
  constructor(private readonly plafondRepository: PlafondRepository) {}

  async execute(
    id: number,
    input: UpdatePlafond,
    tx?: DbClient,
  ): Promise<ReadPlafond> {
    const plafond = await this.plafondRepository.findById(id, tx);
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
    return this.plafondRepository.update(id, input, tx);
  }

  async executePourCible(
    cible: { type: 'ACTE' | 'CATEGORIE'; id: number },
    input: UpdatePlafond,
    tx?: DbClient,
  ): Promise<ReadPlafond> {
    if (
      (cible.type === 'ACTE' && input.categorieActeID != null) ||
      (cible.type === 'CATEGORIE' && input.acteID != null) ||
      (cible.type === 'ACTE' &&
        input.acteID != null &&
        input.acteID !== cible.id) ||
      (cible.type === 'CATEGORIE' &&
        input.categorieActeID != null &&
        input.categorieActeID !== cible.id)
    ) {
      throw new BadRequestException(
        'La cible du plafond doit correspondre à l’identifiant de la route.',
      );
    }

    const plafonds = await this.plafondRepository.findOpenByCible(
      cible,
      input.porteePlafond,
      tx,
    );
    if (plafonds.length === 0) {
      throw new NotFoundException(
        `Aucun plafond ouvert n’existe pour la cible ${cible.type}:${cible.id}.`,
      );
    }
    if (plafonds.length > 1) {
      throw new BadRequestException(
        'porteePlafond est obligatoire lorsque la cible possède plusieurs plafonds ouverts.',
      );
    }

    const {
      acteID: _acteID,
      categorieActeID: _categorieActeID,
      ...modifications
    } = input;
    return this.execute(plafonds[0].id, modifications, tx);
  }
}
