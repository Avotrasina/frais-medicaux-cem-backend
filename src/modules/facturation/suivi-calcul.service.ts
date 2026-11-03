import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { UnitePlafond } from '../../generated/prisma/enums.js';

export interface PlafondSuiviCalcul {
  unite: UnitePlafond;
  valeur: Prisma.Decimal;
}

export interface LigneSuiviCalculInput {
  id: number;
  beneficiaireId: number;
  cible: string;
  dateActe: Date;
  montantActe: Prisma.Decimal;
  plafondAnnuel: PlafondSuiviCalcul;
  plafondParActe?: PlafondSuiviCalcul;
}

export interface LigneSuiviCalculee extends LigneSuiviCalculInput {
  numeroSeance?: number;
  depassementActe?: Prisma.Decimal;
  cumulActeConsomme?: Prisma.Decimal;
  soldePlafond?: Prisma.Decimal;
  capaciteRestante?: Prisma.Decimal;
  depassementPlafond?: Prisma.Decimal;
  totalDepassement: Prisma.Decimal;
  seancesRestantes?: Prisma.Decimal;
}

export class ErreurUnitePlafondSuivi extends Error {}

/** Calcul pur des feuilles T5_x; aucune lecture ou écriture de base de données. */
@Injectable()
export class SuiviCalculService {
  calculer(lignes: readonly LigneSuiviCalculInput[]): LigneSuiviCalculee[] {
    const groupes = new Map<string, LigneSuiviCalculInput[]>();
    for (const ligne of lignes) {
      const annee = ligne.dateActe.getUTCFullYear();
      const cle = `${ligne.beneficiaireId}:${ligne.cible}:${annee}`;
      const groupe = groupes.get(cle) ?? [];
      groupe.push(ligne);
      groupes.set(cle, groupe);
    }

    const resultats = new Map<number, LigneSuiviCalculee>();
    for (const groupe of groupes.values()) {
      groupe.sort((gauche, droite) => gauche.id - droite.id);
      this.verifierUnite(groupe);
      if (groupe[0]?.plafondAnnuel.unite === UnitePlafond.MONTANT) {
        this.calculerMontants(groupe, resultats);
      } else {
        this.calculerSeances(groupe, resultats);
      }
    }
    return [...resultats.values()].sort((gauche, droite) => gauche.id - droite.id);
  }

  private verifierUnite(groupe: readonly LigneSuiviCalculInput[]): void {
    const unite = groupe[0]?.plafondAnnuel.unite;
    if (unite === undefined || groupe.some((ligne) => ligne.plafondAnnuel.unite !== unite)) {
      throw new ErreurUnitePlafondSuivi('L’unité du plafond annuel change dans une même feuille T5_x.');
    }
  }

  private calculerMontants(groupe: readonly LigneSuiviCalculInput[], resultats: Map<number, LigneSuiviCalculee>): void {
    let couverts = new Prisma.Decimal(0);
    let cumuls = new Prisma.Decimal(0);
    for (const ligne of groupe) {
      const retenu = ligne.plafondParActe === undefined
        ? ligne.montantActe
        : Prisma.Decimal.min(ligne.montantActe, ligne.plafondParActe.valeur);
      const depassementActe = ligne.montantActe.minus(retenu);
      const capacite = Prisma.Decimal.max(new Prisma.Decimal(0), ligne.plafondAnnuel.valeur.minus(couverts));
      const couvert = Prisma.Decimal.min(retenu, capacite);
      const depassementPlafond = retenu.minus(couvert);
      couverts = couverts.plus(couvert);
      cumuls = cumuls.plus(retenu);
      resultats.set(ligne.id, {
        ...ligne,
        depassementActe,
        cumulActeConsomme: cumuls,
        soldePlafond: ligne.plafondAnnuel.valeur.minus(cumuls),
        capaciteRestante: Prisma.Decimal.max(new Prisma.Decimal(0), ligne.plafondAnnuel.valeur.minus(couverts)),
        depassementPlafond,
        totalDepassement: depassementActe.plus(depassementPlafond),
      });
    }
  }

  private calculerSeances(groupe: readonly LigneSuiviCalculInput[], resultats: Map<number, LigneSuiviCalculee>): void {
    let seancesCouvertes = 0;
    for (let index = 0; index < groupe.length; index += 1) {
      const ligne = groupe[index];
      const quota = ligne.plafondAnnuel.valeur;
      const couverte = new Prisma.Decimal(seancesCouvertes).lt(quota);
      if (couverte) seancesCouvertes += 1;
      resultats.set(ligne.id, {
        ...ligne,
        numeroSeance: index + 1,
        seancesRestantes: Prisma.Decimal.max(new Prisma.Decimal(0), quota.minus(seancesCouvertes)),
        totalDepassement: couverte ? new Prisma.Decimal(0) : ligne.montantActe,
      });
    }
  }
}
