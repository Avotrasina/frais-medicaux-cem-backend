import { Injectable } from '@nestjs/common';
import type {
  Prisma,
  MouvementFacture,
} from '../../../generated/prisma/client.js';
import { ServiceSortie, TypeMouvement } from '../../../generated/prisma/enums.js';

export interface NouveauMouvementFacture {
  factureGlobaleId: number;
  type: TypeMouvement;
  date?: Date;
  effectueParId: number;
  adresseAId?: number | null;
  remarque?: string | null;
  service?: ServiceSortie | null;
}

/** Point d'écriture des mouvements créés par le workflow Facturation. */
@Injectable()
export class MouvementFactureService {
  async ecrire(
    tx: Prisma.TransactionClient,
    mouvement: NouveauMouvementFacture,
  ): Promise<MouvementFacture> {
    return tx.mouvementFacture.create({
      data: { ...mouvement, date: mouvement.date ?? dateMetierDuJour() },
    });
  }
}

function dateMetierDuJour(): Date {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Indian/Antananarivo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return new Date(`${date}T00:00:00.000Z`);
}
