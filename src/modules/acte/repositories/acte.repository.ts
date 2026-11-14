import { Injectable } from '@nestjs/common';
import { HandlePrismaErrors } from '../../../common/decorators/handle-prisma-errors.decorator.js';
import type { Acte } from '../../../generated/prisma/client.js';
import type { DbClient } from '../../../infrastructure/prisma/db-client.type.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { CreateActe, ReadActe, UpdateActe } from '../types/acte.types.js';

@Injectable()
@HandlePrismaErrors({ exclude: ['toReadActe'] })
export class ActeRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private toReadActe(acte: Acte): ReadActe {
    return {
      id: acte.id,
      code: acte.code,
      nomActe: acte.nomActe,
      listeLibelle: acte.listeLibelle,
      regime: acte.regime,
      categorieActeId: acte.categorieActeId,
    };
  }

  async findAll(tx?: DbClient): Promise<ReadActe[]> {
    const actes = await this.client(tx).acte.findMany({
      orderBy: { code: 'asc' },
    });
    return actes.map((acte) => this.toReadActe(acte));
  }

  async findById(id: number, tx?: DbClient): Promise<ReadActe> {
    const acte = await this.client(tx).acte.findFirstOrThrow({ where: { id } });
    return this.toReadActe(acte);
  }

  async create(acte: CreateActe, tx?: DbClient): Promise<ReadActe> {
    const created = await this.client(tx).acte.create({
      data: {
        code: acte.code,
        nomActe: acte.nomActe,
        listeLibelle: acte.listeLibelle,
        regime: acte.regime,
        categorieActeId: acte.categorieActeId,
      },
    });
    return this.toReadActe(created);
  }

  async update(id: number, acte: UpdateActe, tx?: DbClient): Promise<ReadActe> {
    const updated = await this.client(tx).acte.update({
      where: { id },
      data: {
        code: acte.code,
        nomActe: acte.nomActe,
        listeLibelle: acte.listeLibelle,
        regime: acte.regime,
        categorieActeId: acte.categorieActeId,
      },
    });
    return this.toReadActe(updated);
  }

  async delete(id: number, tx?: DbClient): Promise<void> {
    await this.client(tx).acte.delete({ where: { id } });
  }
}
