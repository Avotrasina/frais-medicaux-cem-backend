export type FixtureLigne = {
  montant: number;
  depassementActe?: number;
  cumul?: number;
  solde?: number;
  capacite?: number;
  depassementPlafond?: number;
  total: number;
  seance?: number;
  seancesRestantes?: number;
};

export type FixtureScenario = {
  cle: string;
  nom: string;
  codes: string[];
  montants: number[];
  annuel: number;
  unite: 'MONTANT' | 'SEANCES';
  parActe?: number;
  attendu: FixtureLigne[];
};

const montantsAnalyse = [300000, 400000, 500000, 400000, 300000];
const attenduMontant = (annuel: number, montants: number[], parActe?: number): FixtureLigne[] => {
  let cumul = 0;
  let couverts = 0;
  return montants.map((montant) => {
    const retenu = parActe === undefined ? montant : Math.min(montant, parActe);
    const depassementActe = montant - retenu;
    const capacite = Math.max(0, annuel - couverts);
    const couvert = Math.min(retenu, capacite);
    const depassementPlafond = retenu - couvert;
    cumul += retenu;
    couverts += couvert;
    return { montant, depassementActe, cumul, solde: annuel - cumul, capacite: Math.max(0, annuel - couverts), depassementPlafond, total: depassementActe + depassementPlafond };
  });
};

const attenduSeances = (quota: number, montants: number[]): FixtureLigne[] => montants.map((montant, index) => ({ montant, seance: index + 1, seancesRestantes: Math.max(0, quota - index - 1), total: index < quota ? 0 : montant }));

export const SCENARIOS_REELS: FixtureScenario[] = [
  { cle: 'analyses', nom: 'Analyses', codes: ['LAB-01', 'LAB-02', 'LAB-03', 'LAB-04', 'LAB-05', 'LAB-06', 'LAB-07', 'LAB-08', 'LAB-99'], montants: montantsAnalyse, annuel: 1000000, unite: 'MONTANT', attendu: attenduMontant(1000000, montantsAnalyse) },
  { cle: 'protheses', nom: 'Prothèses dentaires', codes: ['DEN-05'], montants: montantsAnalyse, annuel: 800000, unite: 'MONTANT', attendu: attenduMontant(800000, montantsAnalyse) },
  { cle: 'orthodontie', nom: 'Orthodontie', codes: ['DEN-06'], montants: montantsAnalyse, annuel: 1000000, unite: 'MONTANT', attendu: attenduMontant(1000000, montantsAnalyse) },
  { cle: 'detartrage', nom: 'Détartrage', codes: ['DEN-02'], montants: montantsAnalyse, annuel: 2, unite: 'SEANCES', attendu: attenduSeances(2, montantsAnalyse) },
  { cle: 'kinesitherapie', nom: 'Kinésithérapie', codes: ['REA-02'], montants: Array.from({ length: 16 }, () => 80000), annuel: 600000, unite: 'MONTANT', parActe: 60000, attendu: attenduMontant(600000, Array.from({ length: 16 }, () => 80000), 60000) },
  { cle: 'orthophonie', nom: 'Orthophonie', codes: ['REA-07'], montants: [80000, 80000, 80000, 30000, 30000, 30000, 50000, 50000, 50000, 80000, 80000, 80000], annuel: 600000, unite: 'MONTANT', parActe: 40000, attendu: attenduMontant(600000, [80000, 80000, 80000, 30000, 30000, 30000, 50000, 50000, 50000, 80000, 80000, 80000], 40000) },
  { cle: 'optique', nom: 'Optique', codes: ['OPH-04'], montants: [100000, 250000, 90000, 300000, 300000], annuel: 500000, unite: 'MONTANT', attendu: attenduMontant(500000, [100000, 250000, 90000, 300000, 300000]) },
];

export const SCENARIOS_PLAFOND: FixtureScenario[] = [
  { cle: 'hausse-sans-depassement', nom: 'Hausse 800 vers 900 sans dépassement', codes: ['DEMO-HAUSSE-SANS'], montants: [500, 600], annuel: 900, unite: 'MONTANT', attendu: attenduMontant(900, [500, 600]) },
  { cle: 'hausse-avec-depassement', nom: 'Hausse 800 vers 900 avec dépassement', codes: ['DEMO-HAUSSE-AVEC'], montants: [800, 600], annuel: 900, unite: 'MONTANT', attendu: attenduMontant(900, [800, 600]) },
  { cle: 'baisse-sans-depassement', nom: 'Baisse 900 vers 800 sans dépassement', codes: ['DEMO-BAISSE-SANS'], montants: [500, 200], annuel: 800, unite: 'MONTANT', attendu: attenduMontant(800, [500, 200]) },
  { cle: 'baisse-avec-depassement', nom: 'Baisse 900 vers 800 avec dépassement', codes: ['DEMO-BAISSE-AVEC'], montants: [700, 400], annuel: 800, unite: 'MONTANT', attendu: attenduMontant(800, [700, 400]) },
];
