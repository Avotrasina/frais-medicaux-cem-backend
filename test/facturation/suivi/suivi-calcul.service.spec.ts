import { Prisma } from '../../../src/generated/prisma/client.js';
import { UnitePlafond } from '../../../src/generated/prisma/enums.js';
import { SuiviCalculService, type LigneSuiviCalculInput } from '../../../src/modules/facturation/suivi/suivi-calcul.service.js';

const dec = (valeur: string): Prisma.Decimal => new Prisma.Decimal(valeur);
const date = (jour: number): Date => new Date(Date.UTC(2026, 0, jour));

function lignes(montants: string[], annuel: string, parActe?: string, unite: UnitePlafond = UnitePlafond.MONTANT): LigneSuiviCalculInput[] {
  return montants.map((montant, index) => ({
    id: index + 1,
    beneficiaireId: 1,
    cible: 'categorie:1',
    dateActe: date(index + 1),
    montantActe: dec(montant),
    plafondAnnuel: { unite, valeur: dec(annuel) },
    ...(parActe === undefined ? {} : { plafondParActe: { unite, valeur: dec(parActe) } }),
  }));
}

describe('SuiviCalculService', () => {
  const service = new SuiviCalculService();

  it('calcule T5_1 : actes de 300000, 400000, 500000, 400000 et 300000 sous un plafond de 1000000', () => {
    const resultat = service.calculer(lignes(['300000', '400000', '500000', '400000', '300000'], '1000000'));
    expect(resultat.map((ligne) => ligne.cumulActeConsomme?.toFixed(0))).toEqual(['300000', '700000', '1200000', '1600000', '1900000']);
    expect(resultat.map((ligne) => ligne.soldePlafond?.toFixed(0))).toEqual(['700000', '300000', '-200000', '-600000', '-900000']);
    expect(resultat.map((ligne) => ligne.totalDepassement.toFixed(0))).toEqual(['0', '0', '200000', '400000', '300000']);
  });

  it('calcule T5_4 : 5 actes consomment les 2 séances prises en charge', () => {
    const resultat = service.calculer(lignes(['300000', '400000', '500000', '400000', '300000'], '2', undefined, UnitePlafond.SEANCES));
    expect(resultat.map((ligne) => ligne.numeroSeance)).toEqual([1, 2, 3, 4, 5]);
    expect(resultat.map((ligne) => ligne.totalDepassement.toFixed(0))).toEqual(['0', '0', '500000', '400000', '300000']);
  });

  it('cumule 11 actes de 80000 avec plafonds annuel et par acte de 600000 et 60000', () => {
    const resultat = service.calculer(lignes(Array.from({ length: 11 }, () => '80000'), '600000', '60000'));
    expect(resultat[9].cumulActeConsomme?.toFixed(0)).toBe('600000');
    expect(resultat[10].cumulActeConsomme?.toFixed(0)).toBe('660000');
    expect(resultat[10].depassementPlafond?.toFixed(0)).toBe('60000');
    expect(resultat[10].totalDepassement.toFixed(0)).toBe('80000');
  });

  it('conserve le dépassement T5 après hausse du plafond annuel de 800 à 900', () => {
    const resultat = service.calculer([
      ...lignes(['500'], '800'),
      { ...lignes(['600'], '900')[0], id: 2, dateActe: date(2) },
    ]);
    expect(resultat[0].totalDepassement.toFixed(0)).toBe('0');
    expect(resultat[1].totalDepassement.toFixed(0)).toBe('200');
  });

  it('ne laisse que 100 de capacité après consommation de 800 et hausse de 800 à 900', () => {
    const resultat = service.calculer([
      { ...lignes(['800'], '800')[0], id: 1 },
      { ...lignes(['200'], '900')[0], id: 2, dateActe: date(2) },
    ]);
    expect(resultat[1].capaciteRestante?.toFixed(0)).toBe('0');
    expect(resultat[1].depassementPlafond?.toFixed(0)).toBe('100');
    expect(resultat[1].totalDepassement.toFixed(0)).toBe('100');
  });

  it('rend les 100 du nouvel acte dépassants après baisse du plafond de 900 à 800', () => {
    const resultat = service.calculer([
      { ...lignes(['900'], '900')[0], id: 1 },
      { ...lignes(['100'], '800')[0], id: 2, dateActe: date(2) },
    ]);
    expect(resultat[1].depassementPlafond?.toFixed(0)).toBe('100');
    expect(resultat[1].totalDepassement.toFixed(0)).toBe('100');
  });
});
