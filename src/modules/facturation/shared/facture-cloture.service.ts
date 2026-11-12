import { ConflictException, Injectable } from '@nestjs/common';

/** Règle unique de verrouillage des factures clôturées. */
@Injectable()
export class FactureClotureService {
  verifierNonCloturee(dateCloture: Date | null | undefined): void {
    if (dateCloture !== null && dateCloture !== undefined) {
      throw new ConflictException('Facture clôturée');
    }
  }
}
