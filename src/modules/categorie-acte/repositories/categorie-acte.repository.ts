import { Injectable } from '@nestjs/common';
import { HandlePrismaErrors } from '../../../common/decorators/handle-prisma-errors.decorator.js';
import type { CategorieActe } from '../../../generated/prisma/client.js';
import type { DbClient } from '../../../infrastructure/prisma/db-client.type.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type {
  CreateCategorieActe,
  ReadCategorieActe,
  UpdateCategorieActe,
} from '../types/categorie-acte.types.js';
import type { ReadActe } from '../../acte/types/acte.types.js';

@Injectable()
@HandlePrismaErrors({ exclude: ['toReadCategorieActe'] })
export class CategorieActeRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private toReadCategorieActe(categorieActe: CategorieActe): ReadCategorieActe {
    return {
      id: categorieActe.id,
      nomCategorie: categorieActe.nomCategorie,
    };
  }

  async findAll(tx?: DbClient): Promise<ReadCategorieActe[]> {
    const categoriesActes = await this.client(tx).categorieActe.findMany({
      orderBy: { nomCategorie: 'asc' },
    });
    return categoriesActes.map((categorieActe) =>
      this.toReadCategorieActe(categorieActe),
    );
  }

  async findAllWithActes(
    tx?: DbClient,
  ): Promise<Array<ReadCategorieActe & { actes: ReadActe[] }>> {
    const categoriesActes = await this.client(tx).categorieActe.findMany({
      include: { actes: { orderBy: { code: 'asc' } } },
      orderBy: { nomCategorie: 'asc' },
    });
    return categoriesActes.map((categorieActe) => ({
      ...this.toReadCategorieActe(categorieActe),
      actes: categorieActe.actes.map((acte) => ({
        id: acte.id,
        code: acte.code,
        nomActe: acte.nomActe,
        listeLibelle: acte.listeLibelle,
        regime: acte.regime,
        categorieActeId: acte.categorieActeId,
      })),
    }));
  }

  async findById(id: number, tx?: DbClient): Promise<ReadCategorieActe> {
    const categorieActe = await this.client(tx).categorieActe.findFirstOrThrow({
      where: { id },
    });
    return this.toReadCategorieActe(categorieActe);
  }

  async create(
    categorieActe: CreateCategorieActe,
    tx?: DbClient,
  ): Promise<ReadCategorieActe> {
    const created = await this.client(tx).categorieActe.create({
      data: { nomCategorie: categorieActe.nomCategorie },
    });
    return this.toReadCategorieActe(created);
  }

  async update(
    id: number,
    categorieActe: UpdateCategorieActe,
    tx?: DbClient,
  ): Promise<ReadCategorieActe> {
    const updated = await this.client(tx).categorieActe.update({
      where: { id },
      data: { nomCategorie: categorieActe.nomCategorie },
    });
    return this.toReadCategorieActe(updated);
  }

  async delete(id: number, tx?: DbClient): Promise<void> {
    await this.client(tx).categorieActe.delete({ where: { id } });
  }
}
