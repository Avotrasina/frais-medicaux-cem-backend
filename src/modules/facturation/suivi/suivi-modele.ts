import { UnitePlafond } from '../../../generated/prisma/enums.js';

export type ModeleSuivi =
  'PLAFOND_ANNUEL' | 'SEANCES' | 'PLAFOND_ACTE_ET_ANNUEL';

export function determinerModeleSuivi(
  parAn: { unite: UnitePlafond } | null,
  parActe?: { unite: UnitePlafond } | null,
): ModeleSuivi | null {
  if (parAn === null) return null;
  if (parAn.unite === UnitePlafond.SEANCES) return 'SEANCES';
  return parActe == null ? 'PLAFOND_ANNUEL' : 'PLAFOND_ACTE_ET_ANNUEL';
}
