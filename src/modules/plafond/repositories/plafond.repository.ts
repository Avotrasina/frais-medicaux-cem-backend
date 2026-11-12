import { ConflictException, Injectable } from '@nestjs/common';
import { HandlePrismaErrors } from '../../../common/decorators/handle-prisma-errors.decorator.js';
import type { Plafond } from '../../../generated/prisma/client.js';
import type { PorteePlafond } from '../../../generated/prisma/enums.js';
import { StatutFacture } from '../../../generated/prisma/enums.js';
import type { DbClient } from '../../../infrastructure/prisma/db-client.type.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { PlafondSuiviGardeService } from '../plafond-suivi-garde.service.js';
import type { PlafondQueryDto } from '../dtos/plafond-query.dto.js';
import { dateAujourdhuiAntananarivo } from '../../../common/date.util.js';
import type {
  CreatePlafond,
  ReadPlafond,
  UpdatePlafond,
} from '../types/plafond.types.js';

@Injectable()
@HandlePrismaErrors({ exclude: ['toReadPlafond'] })
export class PlafondRepository {
  private readonly garde: PlafondSuiviGardeService;

  constructor(
    private readonly prisma: PrismaService,
    garde?: PlafondSuiviGardeService,
  ) {
    this.garde = garde ?? new PlafondSuiviGardeService(prisma);
  }

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private toReadPlafond(plafond: Plafond): ReadPlafond {
    return {
      id: plafond.id,
      dateEffet: plafond.dateEffet.toISOString().slice(0, 10),
      dateFin: plafond.dateFin?.toISOString().slice(0, 10) ?? null,
      porteePlafond: plafond.porteePlafond,
      unite: plafond.unite,
      montant: plafond.montant?.toFixed(2) ?? null,
      nbSeances: plafond.nbSeances,
      acteID: plafond.acteID,
      categorieActeID: plafond.categorieActeID,
    };
  }

  async findAll(
    filters?: PlafondQueryDto,
    tx?: DbClient,
  ): Promise<ReadPlafond[]> {
    const hasFilters =
      filters?.acteId !== undefined ||
      filters?.categorieActeId !== undefined ||
      filters?.date !== undefined;
    const date = filters?.date
      ? new Date(`${filters.date}T00:00:00.000Z`)
      : undefined;
    const plafonds = await this.client(tx).plafond.findMany({
      ...(hasFilters
        ? {
            where: {
              ...(filters.acteId === undefined
                ? {}
                : { acteID: filters.acteId }),
              ...(filters.categorieActeId === undefined
                ? {}
                : { categorieActeID: filters.categorieActeId }),
              ...(date === undefined
                ? {}
                : {
                    dateEffet: { lte: date },
                    OR: [{ dateFin: null }, { dateFin: { gte: date } }],
                  }),
            },
          }
        : {}),
      orderBy: { id: 'asc' },
    });
    return plafonds.map((plafond) => this.toReadPlafond(plafond));
  }

  async findById(id: number, tx?: DbClient): Promise<ReadPlafond> {
    const plafond = await this.client(tx).plafond.findFirstOrThrow({
      where: { id },
    });
    return this.toReadPlafond(plafond);
  }

  async findOpenByCible(
    cible: { type: 'ACTE' | 'CATEGORIE'; id: number },
    porteePlafond?: PorteePlafond,
    tx?: DbClient,
  ): Promise<ReadPlafond[]> {
    const plafonds = await this.client(tx).plafond.findMany({
      where: {
        ...(cible.type === 'ACTE'
          ? { acteID: cible.id }
          : { categorieActeID: cible.id }),
        dateFin: null,
        ...(porteePlafond === undefined ? {} : { porteePlafond }),
      },
      orderBy: [{ dateEffet: 'desc' }, { id: 'desc' }],
    });
    return plafonds.map((plafond) => this.toReadPlafond(plafond));
  }

  async create(
    plafond: Required<
      Pick<CreatePlafond, 'porteePlafond' | 'unite' | 'montant' | 'nbSeances'>
    > &
      Pick<CreatePlafond, 'acteID' | 'categorieActeID'> &
      Pick<CreatePlafond, 'dateEffet'>,
    tx?: DbClient,
  ): Promise<ReadPlafond> {
    if (tx === undefined)
      return this.prisma.$transaction((transaction) =>
        this.create(plafond, transaction),
      );
    const dateEffet = new Date(
      plafond.dateEffet ?? (await this.dateEffetParDefaut(plafond, tx)),
    );
    await this.garde.verifier(
      dateEffet,
      plafond.acteID ?? null,
      plafond.categorieActeID ?? null,
      tx,
    );
    const cible =
      plafond.acteID === null || plafond.acteID === undefined
        ? { categorieActeID: plafond.categorieActeID ?? undefined }
        : { acteID: plafond.acteID };
    const ouvert = await tx.plafond.findFirst({
      where: {
        ...cible,
        porteePlafond: plafond.porteePlafond,
        dateFin: null,
        dateEffet: { lt: dateEffet },
      },
      orderBy: { dateEffet: 'desc' },
    });
    if (ouvert !== null) {
      await tx.plafond.update({
        where: { id: ouvert.id },
        data: { dateFin: jourPrecedent(dateEffet) },
      });
    }
    try {
      const created = await tx.plafond.create({
        data: {
          porteePlafond: plafond.porteePlafond,
          dateEffet,
          dateFin: null,
          unite: plafond.unite,
          montant: plafond.montant,
          nbSeances: plafond.nbSeances,
          acteID: plafond.acteID ?? null,
          categorieActeID: plafond.categorieActeID ?? null,
        },
      });
      return this.toReadPlafond(created);
    } catch (error: unknown) {
      if (contientCodePostgres(error, '23P01'))
        throw new ConflictException(
          'Le nouveau plafond chevauche une version existante pour la même cible et la même portée.',
        );
      throw error;
    }
  }

  private async dateEffetParDefaut(
    plafond: Pick<
      CreatePlafond,
      'acteID' | 'categorieActeID' | 'porteePlafond'
    >,
    tx: DbClient,
  ): Promise<string> {
    const cible =
      plafond.acteID == null
        ? { acteID: null, categorieActeID: plafond.categorieActeID ?? null }
        : { acteID: plafond.acteID, categorieActeID: null };
    const plafondExistant = await tx.plafond.findFirst({
      where: { ...cible, porteePlafond: plafond.porteePlafond },
      select: { id: true },
    });
    if (plafondExistant !== null) return dateAujourdhuiAntananarivo();

    const suiviExistant = await tx.ligneSuivi.findFirst({
      where:
        plafond.acteID == null
          ? {
              acte: {
                categorieActeId: plafond.categorieActeID ?? undefined,
              },
            }
          : { acteId: plafond.acteID },
      select: { id: true },
    });
    return suiviExistant === null ? '1900-01-01' : dateAujourdhuiAntananarivo();
  }

  async update(
    id: number,
    plafond: UpdatePlafond,
    tx?: DbClient,
  ): Promise<ReadPlafond> {
    const courant = await this.client(tx).plafond.findUniqueOrThrow({
      where: { id },
    });
    const client = this.client(tx);
    const ligneUtilisatrice = await client.ligneSuivi.findFirst({
      where: {
        dateActe: {
          gte: courant.dateEffet,
          ...(courant.dateFin === null ? {} : { lte: courant.dateFin }),
        },
        factureGlobale: { statut: { not: StatutFacture.SUPPRIMEE } },
        ...(courant.acteID === null
          ? { acte: { categorieActeId: courant.categorieActeID ?? undefined } }
          : { acteId: courant.acteID }),
      },
      select: { id: true },
    });
    if (
      ligneUtilisatrice !== null &&
      (plafond.montant !== undefined ||
        plafond.nbSeances !== undefined ||
        plafond.unite !== undefined ||
        plafond.porteePlafond !== undefined ||
        plafond.dateEffet !== undefined ||
        plafond.dateFin !== undefined)
    ) {
      throw new ConflictException(
        'Un plafond déjà utilisé par des lignes de suivi ne peut pas être modifié ; créez une nouvelle version.',
      );
    }
    await this.garde.verifier(
      plafond.dateEffet === undefined
        ? courant.dateEffet
        : new Date(plafond.dateEffet),
      plafond.acteID === undefined ? courant.acteID : plafond.acteID,
      plafond.categorieActeID === undefined
        ? courant.categorieActeID
        : plafond.categorieActeID,
      tx,
    );
    const updated = await client.plafond.update({
      where: { id },
      data: {
        porteePlafond: plafond.porteePlafond,
        dateEffet:
          plafond.dateEffet === undefined
            ? undefined
            : new Date(plafond.dateEffet),
        dateFin:
          plafond.dateFin === undefined
            ? undefined
            : plafond.dateFin === null
              ? null
              : new Date(plafond.dateFin),
        unite: plafond.unite,
        montant: plafond.montant,
        nbSeances: plafond.nbSeances,
        acteID: plafond.acteID,
        categorieActeID: plafond.categorieActeID,
      },
    });
    return this.toReadPlafond(updated);
  }

  async delete(id: number, tx?: DbClient): Promise<void> {
    await this.client(tx).plafond.delete({ where: { id } });
  }
}

function jourPrecedent(date: Date): Date {
  const precedent = new Date(date);
  precedent.setUTCDate(precedent.getUTCDate() - 1);
  return precedent;
}

function contientCodePostgres(
  value: unknown,
  code: string,
  profondeur = 0,
): boolean {
  if (profondeur > 5 || value === null || typeof value !== 'object')
    return false;
  const objet = value as Record<string, unknown>;
  return Object.values(objet).some(
    (element) =>
      element === code || contientCodePostgres(element, code, profondeur + 1),
  );
}
