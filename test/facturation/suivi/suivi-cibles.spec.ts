import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { UnitePlafond } from '../../../src/generated/prisma/enums.js';
import { FacturePermissionsService } from '../../../src/modules/facturation/shared/facture-permissions.service.js';
import { SuiviController } from '../../../src/modules/facturation/suivi/suivi.controller.js';
import { SuiviCalculService } from '../../../src/modules/facturation/suivi/suivi-calcul.service.js';
import { SuiviService } from '../../../src/modules/facturation/suivi/suivi.service.js';

vi.mock('../../../src/infrastructure/prisma/prisma.service.js', () => ({
  PrismaService: class PrismaService {},
}));

function plafond(
  id: number,
  source: 'ACTE' | 'CATEGORIE',
  unite = UnitePlafond.MONTANT,
) {
  return {
    id,
    source,
    unite,
    valeur: unite === UnitePlafond.MONTANT ? '100000.00' : 6,
  };
}

function creerService() {
  const actes = [
    {
      id: 1,
      code: 'ACT-01',
      nomActe: 'Analyse',
      categorieActeId: 10,
      categorieActe: { id: 10, nomCategorie: 'Laboratoire' },
    },
    {
      id: 2,
      code: 'ACT-02',
      nomActe: 'Consultation',
      categorieActeId: 10,
      categorieActe: { id: 10, nomCategorie: 'Laboratoire' },
    },
    {
      id: 3,
      code: 'ACT-03',
      nomActe: 'Médicament',
      categorieActeId: 11,
      categorieActe: { id: 11, nomCategorie: 'Pharmacie' },
    },
  ];
  const prisma = {
    acte: { findMany: vi.fn().mockResolvedValue(actes) },
    categorieActe: {
      findMany: vi
        .fn()
        .mockResolvedValue([
          { id: 10, nomCategorie: 'Laboratoire' },
          { id: 11, nomCategorie: 'Pharmacie' },
        ]),
    },
  };
  const resolution = {
    cleCible: ({ type, id }: { type: string; id: number }) => `${type}:${id}`,
    resoudre: vi.fn(async (_cibles, date) => {
      expect(date).toEqual(new Date('2026-11-06T00:00:00.000Z'));
      return new Map([
        [
          'CATEGORIE:10',
          {
            parAn: plafond(100, 'CATEGORIE'),
            parActe: plafond(101, 'CATEGORIE'),
            modeleSuivi: 'PLAFOND_ACTE_ET_ANNUEL',
          },
        ],
        [
          'CATEGORIE:11',
          {
            parAn: plafond(110, 'CATEGORIE'),
            parActe: plafond(111, 'CATEGORIE'),
            modeleSuivi: 'PLAFOND_ACTE_ET_ANNUEL',
          },
        ],
        [
          'ACTE:1',
          {
            parAn: plafond(100, 'CATEGORIE'),
            parActe: plafond(101, 'CATEGORIE'),
            modeleSuivi: 'PLAFOND_ACTE_ET_ANNUEL',
          },
        ],
        [
          'ACTE:2',
          {
            parAn: plafond(100, 'CATEGORIE'),
            parActe: plafond(201, 'ACTE'),
            modeleSuivi: 'PLAFOND_ACTE_ET_ANNUEL',
          },
        ],
        [
          'ACTE:3',
          {
            parAn: plafond(300, 'ACTE'),
            parActe: null,
            modeleSuivi: 'PLAFOND_ANNUEL',
          },
        ],
      ]);
    }),
  };
  const service = new SuiviService(
    prisma as never,
    new SuiviCalculService(),
    new FacturePermissionsService(),
    resolution as never,
  );
  return { service, prisma, resolution };
}

describe('GET /suivis/cibles', () => {
  it('reste accessible sans garde d’authentification pendant le développement', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, SuiviController)).toBeUndefined();
  });

  it('retourne les catégories et actes suivis, avec leurs plafonds annuel et par acte', async () => {
    const { service, resolution } = creerService();

    const cibles = await service.listerCibles('2026-11-06');

    expect(cibles).toEqual([
      {
        type: 'CATEGORIE',
        id: 10,
        nom: 'Laboratoire',
        plafonds: {
          parAn: plafond(100, 'CATEGORIE'),
          parActe: plafond(101, 'CATEGORIE'),
        },
        modeleSuivi: 'PLAFOND_ACTE_ET_ANNUEL',
      },
      {
        type: 'ACTE',
        id: 3,
        nom: 'Médicament',
        code: 'ACT-03',
        categorieActeId: 11,
        categorieActe: 'Pharmacie',
        plafonds: {
          parAn: plafond(300, 'ACTE'),
          parActe: null,
        },
        modeleSuivi: 'PLAFOND_ANNUEL',
      },
    ]);
    expect(resolution.resoudre).toHaveBeenCalledWith(
      expect.arrayContaining([
        { type: 'CATEGORIE', id: 10 },
        { type: 'ACTE', id: 2, categorieActeId: 10 },
      ]),
      new Date('2026-11-06T00:00:00.000Z'),
      false,
    );
  });

  it('utilise aujourd’hui à Antananarivo quand la date est omise', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-06T09:00:00.000Z'));
    try {
      const { service } = creerService();

      await service.listerCibles();
    } finally {
      vi.useRealTimers();
    }
  });

  it('refuse une date impossible', async () => {
    const { service, prisma } = creerService();

    await expect(service.listerCibles('2026-02-30')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.acte.findMany).not.toHaveBeenCalled();
  });
});
