import { BadRequestException } from '@nestjs/common';
import { PorteePlafond, UnitePlafond } from '../../../generated/prisma/enums.js';

type PlafondRulesInput = {
  porteePlafond?: PorteePlafond;
  unite: UnitePlafond;
  montant: number | string | null;
  nbSeances: number | null;
  acteID: number | null;
  categorieActeID: number | null;
};

export function validatePlafond(input: PlafondRulesInput): void {
  const hasActe = input.acteID !== null;
  const hasCategorieActe = input.categorieActeID !== null;
  if (hasActe === hasCategorieActe) {
    throw new BadRequestException(
      'A ceiling must belong to exactly one act or category.',
    );
  }

  if (input.unite === UnitePlafond.MONTANT) {
    const montant = Number(input.montant);
    if (
      input.montant === null ||
      !Number.isFinite(montant) ||
      montant < 0 ||
      input.nbSeances !== null
    ) {
      throw new BadRequestException(
        'A ceiling measured in amount requires a positive montant and must not have nbSeances.',
      );
    }
    return;
  }

  if (input.porteePlafond === PorteePlafond.PAR_ACTE) {
    throw new BadRequestException(
      'Un plafond par acte doit être exprimé en montant.',
    );
  }

  if (
    input.nbSeances === null ||
    !Number.isInteger(input.nbSeances) ||
    input.nbSeances <= 0 ||
    input.montant !== null
  ) {
    throw new BadRequestException(
      'A ceiling measured in sessions requires positive nbSeances and must not have montant.',
    );
  }
}
