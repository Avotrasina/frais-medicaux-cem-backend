import { Prisma } from '../../generated/prisma/client.js';

export type MontantsSerialises<T> = T extends Prisma.Decimal
  ? string
  : T extends Date
    ? Date
    : T extends readonly (infer Element)[]
      ? MontantsSerialises<Element>[]
      : T extends object
        ? { [Cle in keyof T]: MontantsSerialises<T[Cle]> }
        : T;

function convertirValeur(valeur: unknown): unknown {
  if (Prisma.Decimal.isDecimal(valeur)) {
    return valeur.toFixed(2);
  }

  if (valeur instanceof Date || valeur === null || typeof valeur !== 'object') {
    return valeur;
  }

  if (Array.isArray(valeur)) {
    return valeur.map((element: unknown) => convertirValeur(element));
  }

  return Object.fromEntries(
    Object.entries(valeur).map(([cle, element]: [string, unknown]) => [
      cle,
      convertirValeur(element),
    ]),
  );
}

/** Sérialise récursivement les montants Decimal sans perte de précision. */
export function serialiserMontants<T>(valeur: T): MontantsSerialises<T> {
  return convertirValeur(valeur) as MontantsSerialises<T>;
}
