import { Prisma } from '../../../generated/prisma/client.js';
import {
  PorteePlafond,
  UnitePlafond,
} from '../../../generated/prisma/enums.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { PlafondSuiviGardeService } from '../plafond-suivi-garde.service.js';
import { PlafondRepository } from './plafond.repository.js';

vi.mock('../../../infrastructure/prisma/prisma.service.js', () => ({
  PrismaService: class PrismaService {},
}));

describe('PlafondRepository.create default dateEffet', () => {
  const dateFixee = new Date('2026-03-15T12:00:00.000Z');

  function creerContexte(suiviExiste: boolean, plafondExiste = false) {
    const create = vi.fn(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: 8,
        ...data,
        dateEffet: data.dateEffet as Date,
        dateFin: data.dateFin as Date | null,
        montant: new Prisma.Decimal(String(data.montant)),
      }),
    );
    const findFirst = vi
      .fn()
      .mockResolvedValueOnce(plafondExiste ? { id: 4 } : null)
      .mockResolvedValueOnce(null);
    const findSuivi = vi.fn().mockResolvedValue(suiviExiste ? { id: 1 } : null);
    const tx = {
      plafond: { findFirst, create, update: vi.fn() },
      ligneSuivi: { findFirst: findSuivi },
    };
    const verifier = vi.fn().mockResolvedValue(undefined);
    const repository = new PlafondRepository(
      {} as PrismaService,
      { verifier } as unknown as PlafondSuiviGardeService,
    );
    return { create, findFirst, findSuivi, repository, tx, verifier };
  }

  const plafondBase = {
    porteePlafond: PorteePlafond.PAR_AN,
    unite: UnitePlafond.MONTANT,
    montant: 35000,
    nbSeances: null,
    acteID: 8,
    categorieActeID: null,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(dateFixee);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('choisit 1900-01-01 pour la première version sans actes suivis', async () => {
    const { create, findSuivi, repository, tx, verifier } =
      creerContexte(false);

    await repository.create(plafondBase, tx as never);

    expect(findSuivi).toHaveBeenCalledWith({
      where: { acteId: 8 },
      select: { id: true },
    });
    expect(create.mock.calls[0]?.[0].data.dateEffet).toEqual(
      new Date('1900-01-01T00:00:00.000Z'),
    );
    expect(verifier).toHaveBeenCalledWith(
      new Date('1900-01-01T00:00:00.000Z'),
      8,
      null,
      tx,
    );
  });

  it('choisit aujourd’hui lorsqu’une version existe déjà pour cette portée', async () => {
    const { create, findSuivi, repository, tx } = creerContexte(false, true);

    await repository.create(plafondBase, tx as never);

    expect(findSuivi).not.toHaveBeenCalled();
    expect(create.mock.calls[0]?.[0].data.dateEffet).toEqual(
      new Date('2026-03-15T00:00:00.000Z'),
    );
  });

  it('choisit aujourd’hui et applique la garde s’il existe un acte déjà suivi', async () => {
    const { create, repository, tx, verifier } = creerContexte(true);

    await repository.create(plafondBase, tx as never);

    expect(create.mock.calls[0]?.[0].data.dateEffet).toEqual(
      new Date('2026-03-15T00:00:00.000Z'),
    );
    expect(verifier).toHaveBeenCalledWith(
      new Date('2026-03-15T00:00:00.000Z'),
      8,
      null,
      tx,
    );
  });

  it('vérifie les suivis des actes de la catégorie avant de choisir la date', async () => {
    const { create, findSuivi, repository, tx } = creerContexte(true);

    await repository.create(
      {
        ...plafondBase,
        acteID: null,
        categorieActeID: 12,
      },
      tx as never,
    );

    expect(findSuivi).toHaveBeenCalledWith({
      where: { acte: { categorieActeId: 12 } },
      select: { id: true },
    });
    expect(create.mock.calls[0]?.[0].data.dateEffet).toEqual(
      new Date('2026-03-15T00:00:00.000Z'),
    );
  });

  it('conserve la date explicite et la soumet à la garde', async () => {
    const { create, repository, tx, verifier } = creerContexte(false);

    await repository.create(
      { ...plafondBase, dateEffet: '2026-02-01' },
      tx as never,
    );

    expect(create.mock.calls[0]?.[0].data.dateEffet).toEqual(
      new Date('2026-02-01T00:00:00.000Z'),
    );
    expect(verifier).toHaveBeenCalledWith(
      new Date('2026-02-01T00:00:00.000Z'),
      8,
      null,
      tx,
    );
  });
});
