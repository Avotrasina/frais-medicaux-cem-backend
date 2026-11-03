import { Prisma } from '../../../generated/prisma/client.js';
import {
  PorteePlafond,
  UnitePlafond,
} from '../../../generated/prisma/enums.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { PlafondQueryDto } from '../dtos/plafond-query.dto.js';
import { PlafondRepository } from './plafond.repository.js';

vi.mock('../../../infrastructure/prisma/prisma.service.js', () => ({
  PrismaService: class PrismaService {},
}));

describe('PlafondRepository.findAll', () => {
  function creerDepot() {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 1,
        porteePlafond: PorteePlafond.PAR_AN,
        unite: UnitePlafond.MONTANT,
        dateEffet: new Date('2026-01-01T00:00:00.000Z'),
        dateFin: null,
        montant: new Prisma.Decimal('35000'),
        nbSeances: null,
        acteID: 8,
        categorieActeID: null,
      },
    ]);
    const prisma = { plafond: { findMany } };
    return {
      findMany,
      repository: new PlafondRepository(prisma as unknown as PrismaService),
    };
  }

  it('conserve la liste complète sans filtre et formate les montants à deux décimales', async () => {
    const { findMany, repository } = creerDepot();

    const resultats = await repository.findAll();

    expect(findMany).toHaveBeenCalledWith({ orderBy: { id: 'asc' } });
    expect(resultats[0]?.montant).toBe('35000.00');
  });

  it('filtre par cible et période de validité', async () => {
    const { findMany, repository } = creerDepot();
    const filtres = Object.assign(new PlafondQueryDto(), {
      acteId: 8,
      categorieActeId: 3,
      date: '2026-02-15',
    });

    await repository.findAll(filtres);

    expect(findMany).toHaveBeenCalledWith({
      where: {
        acteID: 8,
        categorieActeID: 3,
        dateEffet: { lte: new Date('2026-02-15T00:00:00.000Z') },
        OR: [
          { dateFin: null },
          { dateFin: { gte: new Date('2026-02-15T00:00:00.000Z') } },
        ],
      },
      orderBy: { id: 'asc' },
    });
  });
});
