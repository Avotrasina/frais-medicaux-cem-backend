import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { UpdatePlafondUseCase } from '../../plafond/use-cases/plafond.update.js';
import type { UpdatePlafond } from '../../plafond/types/plafond.types.js';
import { CategorieActeRepository } from '../repositories/categorie-acte.repository.js';
import type {
  ReadCategorieActe,
  UpdateCategorieActe,
} from '../types/categorie-acte.types.js';

@Injectable()
export class UpdateCategorieActeUseCase {
  constructor(
    private readonly categorieActeRepository: CategorieActeRepository,
    private readonly prisma: PrismaService,
    private readonly updatePlafond: UpdatePlafondUseCase,
  ) {}

  async execute(
    id: number,
    input: UpdateCategorieActe & UpdatePlafond,
  ): Promise<ReadCategorieActe> {
    const {
      dateEffet,
      dateFin,
      porteePlafond,
      unite,
      montant,
      nbSeances,
      acteID: _acteID,
      categorieActeID: _categorieActeID,
      ...donneesCategorie
    } = input;
    const plafondInput: UpdatePlafond = {
      dateEffet,
      dateFin,
      porteePlafond,
      unite,
      montant,
      nbSeances,
      acteID: input.acteID,
      categorieActeID: input.categorieActeID,
    };
    const modifierPlafond = [
      dateEffet,
      dateFin,
      porteePlafond,
      unite,
      montant,
      nbSeances,
    ].some((valeur) => valeur !== undefined);

    if (Object.keys(donneesCategorie).length === 0 && !modifierPlafond) {
      return this.categorieActeRepository.findById(id);
    }
    if (!modifierPlafond) {
      return this.categorieActeRepository.update(id, donneesCategorie);
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedCategorie =
        Object.keys(donneesCategorie).length === 0
          ? await this.categorieActeRepository.findById(id, tx)
          : await this.categorieActeRepository.update(id, donneesCategorie, tx);
      await this.updatePlafond.executePourCible(
        { type: 'CATEGORIE', id },
        plafondInput,
        tx,
      );
      return updatedCategorie;
    });
  }
}
