import { BadRequestException, Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { formaterRefSociale } from './ref-social.format.js';

@Injectable()
export class RefSocialService {
  /**
   * Incrémente atomiquement le compteur de l'année dans la transaction reçue.
   *
   * Exemple d'appel dans FactureGlobaleService :
   * prisma.$transaction(async (tx) => {
   *   const refSociale = await refSocialService.genererProchaine(tx, annee);
   *   return tx.factureGlobale.create({ data: { ...donnees, refSociale, annee } });
   * });
   */
  async genererProchaine(
    tx: Prisma.TransactionClient,
    annee: number,
  ): Promise<string> {
    if (!Number.isInteger(annee) || annee < 2000 || annee > 2999) {
      throw new BadRequestException(
        "L'année doit être un entier compris entre 2000 et 2999.",
      );
    }

    const lignes = await tx.$queryRaw<Array<{ dernier_numero: number }>>`
      INSERT INTO "facturation"."compteur_ref_sociale" AS compteur ("annee", "dernier_numero")
      VALUES (${annee}, 1)
      ON CONFLICT ("annee") DO UPDATE
      SET "dernier_numero" = compteur."dernier_numero" + 1
      RETURNING "dernier_numero"
    `;

    const ligne = lignes[0];
    if (ligne === undefined) {
      throw new Error(
        "Le compteur de référence sociale n'a retourné aucun numéro.",
      );
    }

    return formaterRefSociale(annee, ligne.dernier_numero);
  }
}
