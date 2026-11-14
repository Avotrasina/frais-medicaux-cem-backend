import {
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client.js';
import {
  StatutFacture,
  TypeMouvement,
} from '../../../../generated/prisma/enums.js';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service.js';
import { FactureIndividuelleService } from '../individuelle/facture-individuelle.service.js';
import { MouvementFactureService } from '../../shared/mouvement-facture.service.js';

interface RefusCloture {
  factureId: number;
  refSociale: string | null;
  raison: string;
  detail?: {
    champ: string;
    valeurFacture: string;
    totalLignes: string;
    ecart: string;
  };
}

@Injectable()
export class CloturePaieService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly facturesIndividuelles: FactureIndividuelleService,
    private readonly mouvements: MouvementFactureService,
  ) {}

  async cloturer(
    mois: string,
    dateCloture: string,
    factureIds: number[],
    auteurId: number,
  ): Promise<{
    moisPaie: string;
    dateCloture: string;
    factures: Array<{
      id: number;
      refSociale: string;
      nombreLignes: number;
      totalAgent: string;
    }>;
  }> {
    const moisPaie = new Date(`${mois}-01T00:00:00.000Z`);
    const dateMetierCloture = new Date(`${dateCloture}T00:00:00.000Z`);

    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw<{ id: number }[]>`
        SELECT "id"
        FROM "facturation"."facture_globale"
        WHERE "id" IN (${Prisma.join(factureIds)})
        ORDER BY "id"
        FOR UPDATE
      `;

      const existantes = await tx.factureGlobale.findMany({
        where: { id: { in: factureIds } },
        select: {
          id: true,
          refSociale: true,
          statut: true,
          dateCloture: true,
        },
      });
      const parId = new Map(existantes.map((facture) => [facture.id, facture]));
      const refus: RefusCloture[] = [];

      for (const factureId of factureIds) {
        const facture = parId.get(factureId);
        if (facture === undefined) {
          refus.push({ factureId, refSociale: null, raison: 'INTROUVABLE' });
          continue;
        }
        if (facture.statut === StatutFacture.SUPPRIMEE) {
          refus.push({
            factureId,
            refSociale: facture.refSociale,
            raison: 'SUPPRIMEE',
          });
          continue;
        }
        if (facture.dateCloture !== null) {
          refus.push({
            factureId,
            refSociale: facture.refSociale,
            raison: 'DEJA_CLOTUREE',
          });
          continue;
        }

        const rapprochement = await this.facturesIndividuelles.rapprochement(
          factureId,
          tx,
        );
        if (rapprochement.statut === 'INCOMPLET') {
          refus.push({
            factureId,
            refSociale: facture.refSociale,
            raison: 'INCOMPLET',
          });
        } else if (rapprochement.statut === 'ECART') {
          refus.push({
            factureId,
            refSociale: facture.refSociale,
            raison: 'ECART',
            detail: this.detailEcart(rapprochement.controle),
          });
        }
      }

      if (refus.length > 0) {
        throw new HttpException(refus, 409);
      }

      const miseAJour = await tx.factureGlobale.updateMany({
        where: { id: { in: factureIds }, dateCloture: null },
        data: { moisPaie, dateCloture: dateMetierCloture },
      });
      if (miseAJour.count !== factureIds.length) {
        throw new ConflictException(
          'La clôture a échoué car une ou plusieurs factures ont été modifiées simultanément.',
        );
      }

      await tx.factureIndividuelle.updateMany({
        where: { factureGlobaleId: { in: factureIds } },
        data: { moisAffectation: moisPaie },
      });

      const resultats: Array<{
        id: number;
        refSociale: string;
        nombreLignes: number;
        totalAgent: string;
      }> = [];
      for (const factureId of factureIds) {
        const facture = parId.get(factureId);
        if (facture === undefined) {
          throw new NotFoundException(
            `La facture ${factureId} est introuvable.`,
          );
        }
        const total = await this.facturesIndividuelles.totalAgent(
          factureId,
          tx,
        );
        resultats.push({
          id: factureId,
          refSociale: facture.refSociale,
          ...total,
        });
        await this.mouvements.ecrire(tx, {
          factureGlobaleId: factureId,
          type: TypeMouvement.CLOTURE,
          date: dateMetierCloture,
          effectueParId: auteurId,
        });
      }

      return {
        moisPaie: mois,
        dateCloture,
        factures: resultats,
      };
    });
  }

  private detailEcart(controle: {
    sommes: {
      montantActe: string;
      montantCemIntegral: string;
      depassement: string;
    };
    facture: {
      montantTotal: string;
      total100Cem: string;
      totalDepassement: string;
    };
    ecarts: {
      montantActe: string;
      montantCemIntegral: string;
      depassement: string;
    };
  }): RefusCloture['detail'] {
    const champs = [
      {
        champ: 'montantTotal',
        valeurFacture: controle.facture.montantTotal,
        totalLignes: controle.sommes.montantActe,
        ecart: controle.ecarts.montantActe,
      },
      {
        champ: 'total100Cem',
        valeurFacture: controle.facture.total100Cem,
        totalLignes: controle.sommes.montantCemIntegral,
        ecart: controle.ecarts.montantCemIntegral,
      },
      {
        champ: 'totalDepassement',
        valeurFacture: controle.facture.totalDepassement,
        totalLignes: controle.sommes.depassement,
        ecart: controle.ecarts.depassement,
      },
    ];
    const ecart = champs.find(
      (champ) => !new Prisma.Decimal(champ.ecart).isZero(),
    );
    if (ecart === undefined) return undefined;
    return {
      champ: ecart.champ,
      valeurFacture: ecart.valeurFacture,
      totalLignes: ecart.totalLignes,
      ecart: new Prisma.Decimal(ecart.ecart).abs().toFixed(2),
    };
  }
}
