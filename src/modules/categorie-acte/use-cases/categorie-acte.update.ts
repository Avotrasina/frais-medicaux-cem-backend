import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { ConstraintRulesService } from '../../plafond/contrainte-rules.service.js';
import type { PlafondsModificationDto } from '../../plafond/dtos/plafond.dto.js';
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
    private readonly contraintes: ConstraintRulesService,
  ) {}

  async execute(
    id: number,
    input: UpdateCategorieActe & UpdatePlafond & { plafonds?: PlafondsModificationDto | null },
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
      plafonds,
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

    if (Object.keys(donneesCategorie).length === 0 && !modifierPlafond && plafonds === undefined) {
      return this.categorieActeRepository.findById(id);
    }
    if (plafonds === undefined && !modifierPlafond) {
      return this.categorieActeRepository.update(id, donneesCategorie);
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedCategorie =
        Object.keys(donneesCategorie).length === 0
          ? await this.categorieActeRepository.findById(id, tx)
          : await this.categorieActeRepository.update(id, donneesCategorie, tx);
      if (plafonds !== undefined) {
        await this.contraintes.applyConstraint(
          { type: 'CATEGORIE', id },
          plafonds,
          tx,
        );
        if (plafonds !== null) {
          // Rule 3: the acts of the category inherit the constraint, their own
          // constraint is cleared in the same transaction.
          await this.contraintes.purgeActsConstraints(id, tx);
        }
        return updatedCategorie;
      }
      await this.updatePlafond.executePourCible(
        { type: 'CATEGORIE', id },
        plafondInput,
        tx,
      );
      return updatedCategorie;
    });
  }
}
