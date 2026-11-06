import { Prisma } from '../../../generated/prisma/client.js';
import { TypeRegle } from '../../../generated/prisma/enums.js';
import { FactureCalculService } from './facture-calcul.service.js';

describe('FactureCalculService.calculerPartsLigne', () => {
  const service = new FactureCalculService();
  const tauxCem = new Prisma.Decimal(80);

  it.each([
    {
      montantActe: 30000,
      montantCemIntegral: 0,
      depassement: 0,
      attendu: [24000, 6000, 6000],
    },
    {
      montantActe: 4000000,
      montantCemIntegral: 4000000,
      depassement: 0,
      attendu: [0, 0, 0],
    },
    {
      montantActe: 1970000,
      montantCemIntegral: 0,
      depassement: 1000000,
      attendu: [776000, 194000, 1194000],
    },
    {
      montantActe: 100000,
      montantCemIntegral: 40000,
      depassement: 10000,
      attendu: [40000, 10000, 20000],
    },
  ])(
    'calcule les parts T6 pour montant=$montantActe, intégral=$montantCemIntegral et dépassement=$depassement',
    ({ montantActe, montantCemIntegral, depassement, attendu }) => {
      const ligne = service.calculerLigne(
        montantActe,
        depassement,
        0,
        { type: TypeRegle.REPARTITION_AGENT_CEM, tauxCem },
        montantCemIntegral,
      );
      const parts = service.calculerPartsLigne(ligne);

      expect([
        parts.montantCem.minus(ligne.montantCemIntegral).toNumber(),
        parts.montantAgent.toNumber(),
        parts.totalChargeAgent.toNumber(),
      ]).toEqual(attendu);
      expect(parts.montantCem.toNumber()).toBe(
        montantCemIntegral + attendu[0],
      );
    },
  );

  it('propose la base comme montant intégral pour une règle de charge totale', () => {
    const ligne = service.calculerLigne(
      100000,
      10000,
      0,
      { type: TypeRegle.CHARGE_TOTALE_CEM, tauxCem },
    );

    expect(ligne.montantCemIntegral.toNumber()).toBe(90000);
  });

  it('refuse un montant CEM intégral supérieur à la base', () => {
    expect(() =>
      service.calculerLigne(
        100000,
        10000,
        0,
        { type: TypeRegle.REPARTITION_AGENT_CEM, tauxCem },
        90001,
      ),
    ).toThrow('Le montant CEM intégral doit être compris entre zéro et la base');
  });
});
