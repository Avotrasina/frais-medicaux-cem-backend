import { Prisma } from '../../generated/prisma/client.js';
import { PorteePlafond, UnitePlafond } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { CategorieActeQueryDto } from '../categorie-acte/dtos/categorie-acte-query.dto.js';
import { CategorieActeRepository } from '../categorie-acte/repositories/categorie-acte.repository.js';
import { ReadCategorieActeUseCase } from '../categorie-acte/use-cases/categorie-acte.read.js';
import {
  PlafondResolutionService,
  type CiblePlafond,
} from './plafond-resolution.service.js';

vi.mock('../../infrastructure/prisma/prisma.service.js', () => ({
  PrismaService: class PrismaService {},
}));

const date = new Date('2026-03-15T00:00:00.000Z');

function plafond(
  id: number,
  porteePlafond: PorteePlafond,
  cible: { acteID: number | null; categorieActeID: number | null },
  options: {
    dateEffet?: string;
    dateFin?: string | null;
    montant?: string;
    nbSeances?: number;
  } = {},
) {
  return {
    id,
    porteePlafond,
    unite:
      options.nbSeances === undefined
        ? UnitePlafond.MONTANT
        : UnitePlafond.SEANCES,
    dateEffet: new Date(`${options.dateEffet ?? '2026-01-01'}T00:00:00.000Z`),
    dateFin:
      options.dateFin === undefined || options.dateFin === null
        ? null
        : new Date(`${options.dateFin}T00:00:00.000Z`),
    montant:
      options.nbSeances === undefined
        ? new Prisma.Decimal(options.montant ?? '40000.00')
        : null,
    nbSeances: options.nbSeances ?? null,
    acteID: cible.acteID,
    categorieActeID: cible.categorieActeID,
  };
}

function creerService(plafondsEnVigueur: ReturnType<typeof plafond>[]) {
  const findMany = vi
    .fn()
    .mockResolvedValueOnce(plafondsEnVigueur)
    .mockResolvedValueOnce(plafondsEnVigueur);
  const prisma = { plafond: { findMany } };
  return {
    findMany,
    service: new PlafondResolutionService(prisma as unknown as PrismaService),
  };
}

describe('PlafondResolutionService', () => {
  it('préfère le plafond propre à l’acte à celui de sa catégorie', async () => {
    const { service } = creerService([
      plafond(1, PorteePlafond.PAR_AN, {
        acteID: null,
        categorieActeID: 8,
      }),
      plafond(2, PorteePlafond.PAR_AN, { acteID: 10, categorieActeID: null }),
      plafond(
        3,
        PorteePlafond.PAR_ACTE,
        { acteID: null, categorieActeID: 8 },
        { montant: '10000.00' },
      ),
      plafond(
        4,
        PorteePlafond.PAR_ACTE,
        { acteID: 10, categorieActeID: null },
        { montant: '5000.00' },
      ),
    ]);

    const resultat = await service.resoudre(
      [{ type: 'ACTE', id: 10, categorieActeId: 8 }],
      date,
      false,
    );

    expect(resultat.get('ACTE:10')).toMatchObject({
      parActe: { id: 4, valeur: '5000.00', source: 'ACTE' },
      parAn: { id: 2, valeur: '40000.00', source: 'ACTE' },
      modeleSuivi: 'PLAFOND_ACTE_ET_ANNUEL',
    });
    expect(resultat.get('ACTE:10')?.parActe).not.toHaveProperty('dateEffet');
    expect(resultat.get('ACTE:10')?.parAn).not.toHaveProperty('dateFin');
  });

  it('hérite des plafonds de catégorie quand l’acte n’a pas les siens', async () => {
    const { service } = creerService([
      plafond(1, PorteePlafond.PAR_AN, {
        acteID: null,
        categorieActeID: 8,
      }),
      plafond(2, PorteePlafond.PAR_ACTE, {
        acteID: null,
        categorieActeID: 8,
      }),
    ]);

    const resultat = await service.resoudre(
      [{ type: 'ACTE', id: 10, categorieActeId: 8 }],
      date,
      false,
    );

    expect(resultat.get('ACTE:10')).toMatchObject({
      parActe: { id: 2, source: 'CATEGORIE' },
      parAn: { id: 1, source: 'CATEGORIE' },
      modeleSuivi: 'PLAFOND_ACTE_ET_ANNUEL',
    });
  });

  it('renvoie des plafonds nuls avant leur date d’effet', async () => {
    const { service, findMany } = creerService([]);

    const resultat = await service.resoudre(
      [{ type: 'ACTE', id: 10, categorieActeId: 8 }],
      new Date('2025-12-31T00:00:00.000Z'),
      false,
    );

    expect(resultat.get('ACTE:10')).toEqual({
      parActe: null,
      parAn: null,
      modeleSuivi: null,
    });
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany.mock.calls[0]?.[0].where.AND[1]).toEqual({
      dateEffet: { lte: new Date('2025-12-31T00:00:00.000Z') },
    });
  });

  it('renvoie l’historique propre à chaque cible par date décroissante', async () => {
    const ancienneVersion = plafond(
      1,
      PorteePlafond.PAR_AN,
      { acteID: 10, categorieActeID: null },
      { dateEffet: '2025-01-01', dateFin: '2025-12-31' },
    );
    const versionCourante = plafond(
      2,
      PorteePlafond.PAR_AN,
      { acteID: 10, categorieActeID: null },
      { dateEffet: '2026-01-01' },
    );
    const { service } = creerService([versionCourante, ancienneVersion]);

    const resultat = await service.resoudre(
      [{ type: 'ACTE', id: 10, categorieActeId: 8 }],
      date,
      true,
    );

    expect(resultat.get('ACTE:10')?.historique).toEqual([
      {
        id: 2,
        unite: UnitePlafond.MONTANT,
        valeur: '40000.00',
        dateEffet: '2026-01-01',
        dateFin: null,
        source: 'ACTE',
        porteePlafond: PorteePlafond.PAR_AN,
      },
      {
        id: 1,
        unite: UnitePlafond.MONTANT,
        valeur: '40000.00',
        dateEffet: '2025-01-01',
        dateFin: '2025-12-31',
        source: 'ACTE',
        porteePlafond: PorteePlafond.PAR_AN,
      },
    ]);
  });

  it('associe les plafonds hérités à plusieurs actes en une requête', async () => {
    const { service, findMany } = creerService([
      plafond(1, PorteePlafond.PAR_AN, {
        acteID: null,
        categorieActeID: 8,
      }),
      plafond(
        2,
        PorteePlafond.PAR_ACTE,
        { acteID: 11, categorieActeID: null },
        { montant: '12000.00' },
      ),
    ]);
    const cibles: CiblePlafond[] = [
      { type: 'CATEGORIE', id: 8 },
      { type: 'ACTE', id: 10, categorieActeId: 8 },
      { type: 'ACTE', id: 11, categorieActeId: 8 },
    ];

    const resultat = await service.resoudre(cibles, date, false);

    expect(resultat.get('ACTE:10')?.parAn).toMatchObject({
      id: 1,
      source: 'CATEGORIE',
    });
    expect(resultat.get('ACTE:11')).toMatchObject({
      parActe: { id: 2, source: 'ACTE' },
      parAn: { id: 1, source: 'CATEGORIE' },
    });
    expect(findMany).toHaveBeenCalledTimes(1);
  });

  it('inclut plusieurs actes avec leurs plafonds résolus dans une catégorie', async () => {
    const categorie = {
      id: 8,
      nomCategorie: 'Catégorie de test',
      actes: [
        {
          id: 10,
          code: 'ACT-10',
          nomActe: 'Acte 10',
          listeLibelle: 'Acte 10',
          regime: 'NORMAL',
          categorieActeId: 8,
        },
        {
          id: 11,
          code: 'ACT-11',
          nomActe: 'Acte 11',
          listeLibelle: 'Acte 11',
          regime: 'NORMAL',
          categorieActeId: 8,
        },
      ],
    };
    const repository = {
      findAllWithActes: vi.fn().mockResolvedValue([categorie]),
    };
    const { service, findMany } = creerService([
      plafond(1, PorteePlafond.PAR_AN, {
        acteID: null,
        categorieActeID: 8,
      }),
    ]);
    const useCase = new ReadCategorieActeUseCase(
      repository as unknown as CategorieActeRepository,
      service,
    );
    const query = Object.assign(new CategorieActeQueryDto(), {
      avecPlafonds: true,
      inclureActes: true,
    });

    const resultat = await useCase.findAll(query);

    expect(resultat).toMatchObject([
      {
        modeleSuivi: 'PLAFOND_ANNUEL',
        actes: [
          {
            id: 10,
            plafonds: { parAn: { id: 1, source: 'CATEGORIE' } },
          },
          {
            id: 11,
            plafonds: { parAn: { id: 1, source: 'CATEGORIE' } },
          },
        ],
      },
    ]);
    expect(findMany).toHaveBeenCalledTimes(1);
  });

  it('renvoie des plafonds nuls quand aucune version n’existe', async () => {
    const { service } = creerService([]);

    const resultat = await service.resoudre(
      [{ type: 'CATEGORIE', id: 8 }],
      date,
      false,
    );

    expect(resultat.get('CATEGORIE:8')).toEqual({
      parActe: null,
      parAn: null,
      modeleSuivi: null,
    });
  });
});
