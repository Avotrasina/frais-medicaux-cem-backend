import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { TypeRegle } from '../../../generated/prisma/enums.js';

export interface PartsFacture {
  reste: Prisma.Decimal;
  partCem: Prisma.Decimal;
  partAgent: Prisma.Decimal;
  totalChargeAgent: Prisma.Decimal;
}

export interface CalculLigneFacture {
  montantActe: Prisma.Decimal;
  montantDepassementActe: Prisma.Decimal;
  montantDepassementPlafond: Prisma.Decimal;
  tauxCem: Prisma.Decimal;
  montantCemIntegral: Prisma.Decimal;
}

export interface PartsLigneFacture {
  montantCem: Prisma.Decimal;
  montantAgent: Prisma.Decimal;
  montantDepassement: Prisma.Decimal;
  totalChargeAgent: Prisma.Decimal;
}

/** Calcule les parts théoriques sans lire ni modifier la base. */
@Injectable()
export class FactureCalculService {
  calculerLigne(
    montantActe: number | string | Prisma.Decimal,
    montantDepassementActe: number | string | Prisma.Decimal,
    montantDepassementPlafond: number | string | Prisma.Decimal,
    regle: { type: TypeRegle; tauxCem: Prisma.Decimal },
  ): CalculLigneFacture {
    const montant = new Prisma.Decimal(String(montantActe));
    const depassementActe = new Prisma.Decimal(String(montantDepassementActe));
    const depassementPlafond = new Prisma.Decimal(
      String(montantDepassementPlafond),
    );
    if (
      montant.isNegative() ||
      depassementActe.isNegative() ||
      depassementPlafond.isNegative()
    ) {
      throw new BadRequestException(
        'Les montants et dépassements ne peuvent pas être négatifs.',
      );
    }
    if (depassementActe.plus(depassementPlafond).greaterThan(montant)) {
      throw new BadRequestException(
        'La somme des dépassements ne peut pas dépasser le montant de l’acte.',
      );
    }
    const base = montant.minus(depassementActe).minus(depassementPlafond);
    return {
      montantActe: montant,
      montantDepassementActe: depassementActe,
      montantDepassementPlafond: depassementPlafond,
      tauxCem: regle.tauxCem,
      montantCemIntegral:
        regle.type === TypeRegle.CHARGE_TOTALE_CEM
          ? base
          : new Prisma.Decimal(0),
    };
  }

  calculerPartsLigne(ligne: CalculLigneFacture): PartsLigneFacture {
    const base = ligne.montantActe
      .minus(ligne.montantDepassementActe)
      .minus(ligne.montantDepassementPlafond);
    const montantCem = ligne.montantCemIntegral.isZero()
      ? base
          .mul(ligne.tauxCem)
          .div(100)
          .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
      : ligne.montantCemIntegral;
    const montantAgent = base.minus(montantCem);
    const montantDepassement = ligne.montantDepassementActe.plus(
      ligne.montantDepassementPlafond,
    );

    return {
      montantCem,
      montantAgent,
      montantDepassement,
      totalChargeAgent: montantAgent.plus(montantDepassement),
    };
  }

  calculerParts(
    montantTotal: Prisma.Decimal,
    total100Cem: Prisma.Decimal,
    totalDepassement: Prisma.Decimal,
    tauxCem: Prisma.Decimal,
  ): PartsFacture {
    const reste = montantTotal.minus(total100Cem).minus(totalDepassement);
    const partCem = reste
      .mul(tauxCem)
      .div(100)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const partAgent = reste.minus(partCem);

    return {
      reste,
      partCem,
      partAgent,
      totalChargeAgent: totalDepassement.plus(partAgent),
    };
  }
}
