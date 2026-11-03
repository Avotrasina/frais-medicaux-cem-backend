import { NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { AgentConcerne, TypeRegle } from '../generated/prisma/enums.js';
import { PrismaService } from '../infrastructure/prisma/prisma.service.js';
import { agentConcerneDepuisEstActif, RegleService } from './regle.service.js';

vi.mock('../infrastructure/prisma/prisma.service.js', () => ({
  PrismaService: class PrismaService {},
}));

describe('agentConcerneDepuisEstActif', () => {
  it('associe un agent actif à la règle ACTIF', () => {
    expect(agentConcerneDepuisEstActif(true)).toBe(AgentConcerne.ACTIF);
  });

  it('associe un agent non actif à la règle NON_ACTIF', () => {
    expect(agentConcerneDepuisEstActif(false)).toBe(AgentConcerne.NON_ACTIF);
  });
});

describe('RegleService', () => {
  const date = new Date('2026-03-10T00:00:00.000Z');
  const regleActif = {
    id: 1,
    type: TypeRegle.REPARTITION_AGENT_CEM,
    agentConcerne: AgentConcerne.ACTIF,
    tauxCem: new Prisma.Decimal(80),
    dateEffet: new Date('2026-01-01T00:00:00.000Z'),
    dateFin: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  let trouverRegle: ReturnType<typeof vi.fn>;
  let service: RegleService;

  beforeEach(() => {
    trouverRegle = vi.fn().mockResolvedValue(regleActif);
    const prisma = {
      regle: { findFirst: trouverRegle },
    } as unknown as PrismaService;
    service = new RegleService(prisma);
  });

  it('recherche une règle dont les bornes de période incluent la date', async () => {
    await expect(
      service.obtenirEnVigueur(AgentConcerne.ACTIF, date),
    ).resolves.toBe(regleActif);

    expect(trouverRegle).toHaveBeenCalledWith({
      where: {
        agentConcerne: AgentConcerne.ACTIF,
        dateEffet: { lte: date },
        OR: [{ dateFin: null }, { dateFin: { gte: date } }],
      },
      orderBy: { dateEffet: 'desc' },
    });
  });

  it('lève une erreur française qui cite le statut et la date si aucune règle ne correspond', async () => {
    trouverRegle.mockResolvedValue(null);

    await expect(
      service.obtenirEnVigueur(AgentConcerne.NON_ACTIF, date),
    ).rejects.toThrow(
      "Aucune règle de prise en charge n'est définie pour l'agent non actif (retraité) à la date du 10/03/2026.",
    );
  });

  it('retourne le taux CEM de la règle ACTIF en vigueur', async () => {
    await expect(service.obtenirTauxCemRepartition(date)).resolves.toEqual(
      new Prisma.Decimal(80),
    );
    expect(trouverRegle).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ agentConcerne: AgentConcerne.ACTIF }),
      }),
    );
  });
});
