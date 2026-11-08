import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { dateAujourdhuiAntananarivo } from '../../../common/date.util.js';
import { Prisma } from '../../../generated/prisma/client.js';
import {
  PorteePlafond,
  RegimeActe,
  UnitePlafond,
} from '../../../generated/prisma/enums.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { DbClient } from '../../../infrastructure/prisma/db-client.type.js';
import { CreatePlafondUseCase } from '../../plafond/use-cases/plafond.create.js';
import { PlafondResolutionService } from '../../plafond/plafond-resolution.service.js';
import { CategorieActeRepository } from '../../categorie-acte/repositories/categorie-acte.repository.js';
import { ActeRepository } from '../repositories/acte.repository.js';
import type { CreateActeRequestDto } from '../dtos/acte-creation.dto.js';

type CreatedActe = Awaited<ReturnType<ActeRepository['create']>>;
type CreatedCategorie = Awaited<ReturnType<CategorieActeRepository['create']>>;

@Injectable()
export class CreateActeWithCeilingsUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly actes: ActeRepository,
    private readonly categories: CategorieActeRepository,
    private readonly creerPlafond: CreatePlafondUseCase,
    private readonly resolution: PlafondResolutionService,
  ) {}

  async execute(input: CreateActeRequestDto) {
    if (input.type !== 'CATEGORIE' && input.regime === RegimeActe.EXCLU) {
      if (this.contientPlafond(input.plafonds)) {
        throw new BadRequestException(
          'Un acte de régime EXCLU ne peut pas recevoir de plafond.',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const cible =
        input.type === 'CATEGORIE'
          ? await this.creerCategorie(tx, input)
          : await this.creerActe(tx, input);

      await this.creerPlafonds(tx, cible, input);

      const dateReference = new Date(
        `${input.dateEffet ?? dateAujourdhuiAntananarivo()}T00:00:00.000Z`,
      );
      const ciblePlafond =
        cible.type === 'ACTE'
          ? {
              type: 'ACTE' as const,
              id: cible.data.id,
              categorieActeId: cible.data.categorieActeId,
            }
          : { type: 'CATEGORIE' as const, id: cible.data.id };
      const resolue = await this.resolution.resoudre(
        [ciblePlafond],
        dateReference,
        false,
        tx,
      );
      const plafond = resolue.get(this.resolution.cleCible(ciblePlafond));
      if (plafond === undefined) {
        throw new Error(
          `Les plafonds de la cible ${ciblePlafond.type}:${ciblePlafond.id} ne sont pas résolus.`,
        );
      }
      return {
        ...cible.data,
        plafonds: { parActe: plafond.parActe, parAn: plafond.parAn },
        modeleSuivi: plafond.modeleSuivi,
      };
    });
  }

  private async creerActe(
    tx: Prisma.TransactionClient,
    input: CreateActeRequestDto,
  ): Promise<{ type: 'ACTE'; data: CreatedActe }> {
    if (
      input.code === undefined ||
      input.nomActe === undefined ||
      input.listeLibelle === undefined ||
      input.categorieActeId === undefined
    ) {
      throw new BadRequestException(
        'Les champs code, nomActe, listeLibelle et categorieActeId sont requis pour un acte.',
      );
    }
    const categorie = await tx.categorieActe.findUnique({
      where: { id: input.categorieActeId },
      select: { id: true },
    });
    if (categorie === null) {
      throw new NotFoundException(
        `La catégorie d’acte ${input.categorieActeId} est introuvable.`,
      );
    }
    if (input.plafonds?.parAn !== undefined) {
      const dateReference = new Date(
        `${dateAujourdhuiAntananarivo()}T00:00:00.000Z`,
      );
      const plafondAnnuelCategorie = await tx.plafond.findFirst({
        where: {
          categorieActeID: categorie.id,
          porteePlafond: PorteePlafond.PAR_AN,
          dateEffet: { lte: dateReference },
          OR: [{ dateFin: null }, { dateFin: { gte: dateReference } }],
        },
        select: { id: true },
      });
      if (plafondAnnuelCategorie !== null) {
        throw new ConflictException(
          'La catégorie possède déjà un plafond annuel en vigueur ; le plafond annuel doit rester partagé au niveau de la catégorie.',
        );
      }
    }
    return {
      type: 'ACTE',
      data: await this.actes.create(
        {
          code: input.code,
          nomActe: input.nomActe,
          listeLibelle: input.listeLibelle,
          regime: input.regime,
          categorieActeId: input.categorieActeId,
        },
        tx,
      ),
    };
  }

  private async creerCategorie(
    tx: Prisma.TransactionClient,
    input: CreateActeRequestDto,
  ): Promise<{ type: 'CATEGORIE'; data: CreatedCategorie }> {
    if (input.nomCategorie === undefined) {
      throw new BadRequestException(
        'Le champ nomCategorie est requis pour une catégorie.',
      );
    }
    return {
      type: 'CATEGORIE',
      data: await this.categories.create(
        { nomCategorie: input.nomCategorie },
        tx,
      ),
    };
  }

  private async creerPlafonds(
    tx: Prisma.TransactionClient,
    cible:
      | { type: 'ACTE'; data: CreatedActe }
      | { type: 'CATEGORIE'; data: CreatedCategorie },
    input: CreateActeRequestDto,
  ): Promise<void> {
    const acteID = cible.type === 'ACTE' ? cible.data.id : null;
    const categorieActeID =
      cible.type === 'CATEGORIE'
        ? cible.data.id
        : (input.categorieActeId ?? null);

    if (input.plafonds?.parActe !== undefined) {
      await this.creerPlafond.execute(
        {
          dateEffet: input.dateEffet,
          porteePlafond: PorteePlafond.PAR_ACTE,
          unite: UnitePlafond.MONTANT,
          montant: input.plafonds.parActe.montant,
          nbSeances: null,
          acteID,
          categorieActeID,
        },
        tx,
      );
    }

    if (input.plafonds?.parAn !== undefined) {
      const annuel = input.plafonds.parAn;
      const enMontant = annuel.unite === UnitePlafond.MONTANT;
      await this.creerPlafond.execute(
        {
          dateEffet: input.dateEffet,
          porteePlafond: PorteePlafond.PAR_AN,
          unite: annuel.unite,
          montant: enMontant ? (annuel.montant ?? null) : null,
          nbSeances: enMontant ? null : (annuel.nbSeances ?? null),
          acteID,
          categorieActeID,
        },
        tx,
      );
    }
  }

  private contientPlafond(plafonds: CreateActeRequestDto['plafonds']): boolean {
    return (
      plafonds !== undefined &&
      (plafonds.parActe !== undefined || plafonds.parAn !== undefined)
    );
  }
}
