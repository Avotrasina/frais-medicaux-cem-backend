import { Prisma } from '../../../src/generated/prisma/client.js';
import { TypeRegle } from '../../../src/generated/prisma/enums.js';
import { FactureCalculService } from '../../../src/modules/facturation/shared/facture-calcul.service.js';

describe('FactureCalculService.calculerPartsLigne', () => {
  const service = new FactureCalculService();
  const tauxCem = new Prisma.Decimal(80);

  it.each([
    {
      montantActe: 30000,
      montantCemIntegral: 0,
      depassement: 0,
      partCem80: 24000,
      partAgent: 6000,
      chargeAgent: 6000,
      montantCemTotal: 24000,
    },
    {
      montantActe: 4000000,
      montantCemIntegral: 4000000,
      depassement: 0,
      partCem80: 0,
      partAgent: 0,
      chargeAgent: 0,
      montantCemTotal: 4000000,
    },
    {
      montantActe: 1970000,
      montantCemIntegral: 0,
      depassement: 1000000,
      partCem80: 776000,
      partAgent: 194000,
      chargeAgent: 1194000,
      montantCemTotal: 776000,
    },
    {
      montantActe: 100000,
      montantCemIntegral: 40000,
      depassement: 10000,
      partCem80: 40000,
      partAgent: 10000,
      chargeAgent: 20000,
      montantCemTotal: 80000,
    },
  ])(
    'T6 $montantActe, CEM intégral $montantCemIntegral, dépassement $depassement : CEM 80 % $partCem80, agent $partAgent, charge agent $chargeAgent, total CEM $montantCemTotal',
    ({
      montantActe,
      montantCemIntegral,
      depassement,
      partCem80,
      partAgent,
      chargeAgent,
      montantCemTotal,
    }) => {
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
      ]).toEqual([partCem80, partAgent, chargeAgent]);
      expect(parts.montantCem.toNumber()).toBe(montantCemTotal);
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
