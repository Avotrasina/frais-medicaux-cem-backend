import { Prisma } from '../../generated/prisma/client.js';
import { TypeRegle } from '../../generated/prisma/enums.js';
import { FactureCalculService } from './facture-calcul.service.js';

describe('FactureCalculService', () => {
  const service = new FactureCalculService();
  const decimal = (valeur: string): Prisma.Decimal =>
    new Prisma.Decimal(valeur);

  it('calcule les parts d’un montant comprenant du 100 % CEM et un dépassement', () => {
    const resultat = service.calculerParts(
      decimal('1000000'),
      decimal('400000'),
      decimal('100000'),
      decimal('80'),
    );

    expect(resultat.reste.toFixed(2)).toBe('500000.00');
    expect(resultat.partCem.toFixed(2)).toBe('400000.00');
    expect(resultat.partAgent.toFixed(2)).toBe('100000.00');
    expect(resultat.totalChargeAgent.toFixed(2)).toBe('200000.00');
  });

  it('arrondit la part CEM à deux décimales en moitié vers le haut', () => {
    const resultat = service.calculerParts(
      decimal('100003'),
      decimal('0'),
      decimal('0'),
      decimal('80'),
    );

    expect(resultat.partCem.toFixed(2)).toBe('80002.40');
    expect(resultat.partAgent.toFixed(2)).toBe('20000.60');
    expect(resultat.partCem.plus(resultat.partAgent).toFixed(2)).toBe(
      resultat.reste.toFixed(2),
    );
  });

  it('retourne des parts nulles lorsque le reste est nul', () => {
    const resultat = service.calculerParts(
      decimal('500'),
      decimal('400'),
      decimal('100'),
      decimal('80'),
    );

    expect(resultat.reste.toFixed(2)).toBe('0.00');
    expect(resultat.partCem.toFixed(2)).toBe('0.00');
    expect(resultat.partAgent.toFixed(2)).toBe('0.00');
    expect(resultat.totalChargeAgent.toFixed(2)).toBe('100.00');
  });

  it('calcule la retenue active sans dépassement à 80/20', () => {
    const ligne = service.calculerLigne(100_000, 0, 0, {
      type: TypeRegle.REPARTITION_AGENT_CEM,
      tauxCem: decimal('80'),
    });
    const parts = service.calculerPartsLigne(ligne);

    expect(ligne.montantCemIntegral.toFixed(2)).toBe('0.00');
    expect(parts.montantCem.toFixed(2)).toBe('80000.00');
    expect(parts.montantAgent.toFixed(2)).toBe('20000.00');
    expect(parts.totalChargeAgent.toFixed(2)).toBe('20000.00');
  });

  it('ajoute les dépassements saisis à la retenue agent', () => {
    const ligne = service.calculerLigne(100_000, 30_000, 0, {
      type: TypeRegle.REPARTITION_AGENT_CEM,
      tauxCem: decimal('80'),
    });
    const parts = service.calculerPartsLigne(ligne);

    expect(parts.montantCem.toFixed(2)).toBe('56000.00');
    expect(parts.montantAgent.toFixed(2)).toBe('14000.00');
    expect(parts.totalChargeAgent.toFixed(2)).toBe('44000.00');
  });

  it('affecte la base nette au CEM pour un agent non actif', () => {
    const ligne = service.calculerLigne(100_000, 20_000, 0, {
      type: TypeRegle.CHARGE_TOTALE_CEM,
      tauxCem: decimal('100'),
    });
    const parts = service.calculerPartsLigne(ligne);

    expect(ligne.montantCemIntegral.toFixed(2)).toBe('80000.00');
    expect(parts.montantCem.toFixed(2)).toBe('80000.00');
    expect(parts.montantAgent.toFixed(2)).toBe('0.00');
    expect(parts.totalChargeAgent.toFixed(2)).toBe('20000.00');
  });
});
