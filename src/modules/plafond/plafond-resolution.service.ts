import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import type { Plafond } from '../../generated/prisma/client.js';
import { PorteePlafond, UnitePlafond } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { determinerModeleSuivi } from '../facturation/suivi/suivi-modele.js';

export type CiblePlafond =
  | { type: 'ACTE'; id: number; categorieActeId: number }
  | { type: 'CATEGORIE'; id: number };

export interface PlafondResolu {
  id: number;
  unite: UnitePlafond;
  valeur: string | number;
  source: 'ACTE' | 'CATEGORIE';
}

export interface VersionPlafond extends PlafondResolu {
  porteePlafond: PorteePlafond;
  dateEffet: string;
  dateFin: string | null;
}

export interface PlafondsResolus {
  parActe: PlafondResolu | null;
  parAn: PlafondResolu | null;
  modeleSuivi: ReturnType<typeof determinerModeleSuivi>;
  historique?: VersionPlafond[];
}

@Injectable()
export class PlafondResolutionService {
  constructor(private readonly prisma: PrismaService) {}

  async resoudre(
    cibles: readonly CiblePlafond[],
    date: Date,
    inclureHistorique: boolean,
  ): Promise<Map<string, PlafondsResolus>> {
    const resultats = new Map<string, PlafondsResolus>();
    if (cibles.length === 0) return resultats;

    const acteIds = [
      ...new Set(
        cibles
          .filter((cible) => cible.type === 'ACTE')
          .map((cible) => cible.id),
      ),
    ];
    const categorieIds = [
      ...new Set([
        ...cibles
          .filter((cible) => cible.type === 'CATEGORIE')
          .map((cible) => cible.id),
        ...cibles
          .filter((cible) => cible.type === 'ACTE')
          .map((cible) => cible.categorieActeId),
      ]),
    ];
    const filtresCibles = [
      ...(acteIds.length === 0 ? [] : [{ acteID: { in: acteIds } }]),
      ...(categorieIds.length === 0
        ? []
        : [{ categorieActeID: { in: categorieIds } }]),
    ];
    const dateDuJour = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
    const plafondsEnVigueur = await this.prisma.plafond.findMany({
      where: {
        AND: [
          { OR: filtresCibles },
          { dateEffet: { lte: dateDuJour } },
          { OR: [{ dateFin: null }, { dateFin: { gte: dateDuJour } }] },
        ],
      },
      orderBy: [{ dateEffet: 'desc' }, { id: 'desc' }],
    });
    const plafondParCibleEtPortee = new Map<string, Plafond>();
    for (const plafond of plafondsEnVigueur) {
      const source = plafond.acteID === null ? 'CATEGORIE' : 'ACTE';
      const id = plafond.acteID ?? plafond.categorieActeID;
      if (id === null) continue;
      const cle = this.cle(source, id, plafond.porteePlafond);
      if (!plafondParCibleEtPortee.has(cle)) {
        plafondParCibleEtPortee.set(cle, plafond);
      }
    }

    let historique: Plafond[] = [];
    if (inclureHistorique) {
      historique = await this.prisma.plafond.findMany({
        where: { OR: filtresCibles },
        orderBy: [{ dateEffet: 'desc' }, { id: 'desc' }],
      });
    }

    for (const cible of cibles) {
      const plafondActe =
        cible.type === 'ACTE'
          ? plafondParCibleEtPortee.get(
              this.cle('ACTE', cible.id, PorteePlafond.PAR_ACTE),
            )
          : undefined;
      const plafondCategorie = plafondParCibleEtPortee.get(
        this.cle(
          'CATEGORIE',
          cible.type === 'ACTE' ? cible.categorieActeId : cible.id,
          PorteePlafond.PAR_ACTE,
        ),
      );
      const plafondAnnuelActe =
        cible.type === 'ACTE'
          ? plafondParCibleEtPortee.get(
              this.cle('ACTE', cible.id, PorteePlafond.PAR_AN),
            )
          : undefined;
      const plafondAnnuelCategorie = plafondParCibleEtPortee.get(
        this.cle(
          'CATEGORIE',
          cible.type === 'ACTE' ? cible.categorieActeId : cible.id,
          PorteePlafond.PAR_AN,
        ),
      );
      const plafondParActe = plafondActe ?? plafondCategorie;
      const plafondParAn = plafondAnnuelActe ?? plafondAnnuelCategorie;
      const resultat: PlafondsResolus = {
        parActe: plafondParActe ? this.serialiser(plafondParActe) : null,
        parAn: plafondParAn ? this.serialiser(plafondParAn) : null,
        modeleSuivi: determinerModeleSuivi(
          plafondParAn === undefined ? null : { unite: plafondParAn.unite },
          plafondParActe === undefined
            ? undefined
            : { unite: plafondParActe.unite },
        ),
      };
      if (inclureHistorique) {
        resultat.historique = historique
          .filter((plafond) =>
            cible.type === 'ACTE'
              ? plafond.acteID === cible.id
              : plafond.categorieActeID === cible.id,
          )
          .map((plafond) => ({
            ...this.serialiser(plafond),
            porteePlafond: plafond.porteePlafond,
            dateEffet: plafond.dateEffet.toISOString().slice(0, 10),
            dateFin: plafond.dateFin?.toISOString().slice(0, 10) ?? null,
          }));
      }
      resultats.set(this.cleCible(cible), resultat);
    }
    return resultats;
  }

  cleCible(cible: CiblePlafond): string {
    return `${cible.type}:${cible.id}`;
  }

  private cle(
    source: 'ACTE' | 'CATEGORIE',
    id: number,
    portee: PorteePlafond,
  ): string {
    return `${source}:${id}:${portee}`;
  }

  private serialiser(plafond: Plafond): PlafondResolu {
    const valeur =
      plafond.unite === UnitePlafond.SEANCES
        ? plafond.nbSeances
        : plafond.montant?.toFixed(2);
    if (valeur === null || valeur === undefined) {
      throw new UnprocessableEntityException(
        'La valeur du plafond en vigueur est absente.',
      );
    }
    return {
      id: plafond.id,
      unite: plafond.unite,
      valeur,
      source: plafond.acteID === null ? 'CATEGORIE' : 'ACTE',
    };
  }
}
