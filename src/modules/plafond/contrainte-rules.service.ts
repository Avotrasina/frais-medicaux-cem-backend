import { ConflictException, Injectable } from '@nestjs/common';
import { dateAujourdhuiAntananarivo } from '../../common/date.util.js';
import {
  PorteePlafond,
  UnitePlafond,
} from '../../generated/prisma/enums.js';
import type { DbClient } from '../../infrastructure/prisma/db-client.type.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import type { PlafondsModificationDto } from './dtos/plafond.dto.js';
import { PlafondRepository } from './repositories/plafond.repository.js';
import type { ReadPlafond } from './types/plafond.types.js';
import { CreatePlafondUseCase } from './use-cases/plafond.create.js';

export type CibleContrainte = { type: 'ACTE' | 'CATEGORIE'; id: number };

type PorteeVoulue = {
  unite: UnitePlafond;
  montant: number | null;
  nbSeances: number | null;
};

/**
 * Single source of truth of the T5X constraint rules.
 *
 * 1. An act cannot carry its own constraint when its category carries one.
 * 2. Without a constraint on the category, the act defines its own.
 * 3. Setting a constraint on a category clears the own constraints of its acts,
 *    in the very same transaction.
 *
 * The rules are enforced on every write path, so a direct API call cannot
 * bypass them.
 */
@Injectable()
export class ConstraintRulesService {
  constructor(
    private readonly plafondRepository: PlafondRepository,
    private readonly createPlafond: CreatePlafondUseCase,
    private readonly prisma: PrismaService,
  ) {}

  /** Open ceilings carried by a category. */
  async openConstraintsOfCategory(
    categorieActeId: number,
    tx?: DbClient,
  ): Promise<ReadPlafond[]> {
    return this.plafondRepository.findOpenByCible(
      { type: 'CATEGORIE', id: categorieActeId },
      undefined,
      tx,
    );
  }

  /**
   * Rule 1: an act cannot carry its own constraint when its category carries
   * one — the act inherits the category constraint instead.
   */
  async assertActeWithoutOwnConstraint(
    categorieActeId: number,
    tx?: DbClient,
  ): Promise<void> {
    const plafonds = await this.openConstraintsOfCategory(categorieActeId, tx);
    if (plafonds.length === 0) return;
    throw new ConflictException(
      'La catégorie de l’acte porte déjà une contrainte : l’acte en hérite et ne peut pas définir la sienne.',
    );
  }

  /**
   * Applies the constraint of a target: the provided scopes replace the
   * existing ones, the omitted scopes are cleared.
   */
  async applyConstraint(
    cible: CibleContrainte,
    plafonds: PlafondsModificationDto | null,
    tx?: DbClient,
  ): Promise<void> {
    const parActe = plafonds?.parActe ?? null;
    const parAn = plafonds?.parAn ?? null;
    await this.applyScope(
      cible,
      PorteePlafond.PAR_ACTE,
      parActe === null
        ? null
        : { unite: UnitePlafond.MONTANT, montant: parActe.montant, nbSeances: null },
      tx,
    );
    await this.applyScope(
      cible,
      PorteePlafond.PAR_AN,
      parAn === null
        ? null
        : parAn.unite === UnitePlafond.SEANCES
          ? {
              unite: UnitePlafond.SEANCES,
              montant: null,
              nbSeances: parAn.nbSeances ?? null,
            }
          : {
              unite: UnitePlafond.MONTANT,
              montant: parAn.montant ?? null,
              nbSeances: null,
            },
      tx,
    );
  }

  /**
   * Rule 3: clears the own constraints of every act of a category. Called in
   * the same transaction as the write of the category constraint.
   */
  async purgeActsConstraints(
    categorieActeId: number,
    tx?: DbClient,
  ): Promise<number> {
    const client = tx ?? this.prisma;
    const actes = await client.acte.findMany({
      where: { categorieActeId },
      select: { id: true },
    });
    let purged = 0;
    for (const acte of actes) {
      const plafonds = await this.plafondRepository.findOpenByCible(
        { type: 'ACTE', id: acte.id },
        undefined,
        tx,
      );
      for (const plafond of plafonds) {
        await this.closeScope(plafond, tx);
        purged += 1;
      }
    }
    return purged;
  }

  private async applyScope(
    cible: CibleContrainte,
    portee: PorteePlafond,
    desired: PorteeVoulue | null,
    tx?: DbClient,
  ): Promise<void> {
    const [existant] = await this.plafondRepository.findOpenByCible(
      cible,
      portee,
      tx,
    );
    if (desired === null) {
      if (existant === undefined) return;
      await this.closeScope(existant, tx);
      return;
    }
    if (existant !== undefined && this.sameValue(existant, desired)) return;
    await this.createPlafond.execute(
      {
        porteePlafond: portee,
        unite: desired.unite,
        montant: desired.montant,
        nbSeances: desired.nbSeances,
        acteID: cible.type === 'ACTE' ? cible.id : null,
        categorieActeID: cible.type === 'CATEGORIE' ? cible.id : null,
      },
      tx,
    );
  }

  /** Closes the open version: the constraint leaves the scope, history is kept. */
  private async closeScope(plafond: ReadPlafond, tx?: DbClient): Promise<void> {
    await this.plafondRepository.update(
      plafond.id,
      { dateFin: jourPrecedent(dateAujourdhuiAntananarivo()) },
      tx,
    );
  }

  private sameValue(plafond: ReadPlafond, desired: PorteeVoulue): boolean {
    if (plafond.unite !== desired.unite) return false;
    if (desired.unite === UnitePlafond.MONTANT) {
      return Number(plafond.montant) === Number(desired.montant);
    }
    return plafond.nbSeances === desired.nbSeances;
  }
}

function jourPrecedent(date: string): string {
  const precedent = new Date(`${date}T00:00:00.000Z`);
  precedent.setUTCDate(precedent.getUTCDate() - 1);
  return precedent.toISOString().slice(0, 10);
}
