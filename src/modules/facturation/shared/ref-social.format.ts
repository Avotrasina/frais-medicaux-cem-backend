import { BadRequestException } from '@nestjs/common';

function validerAnnee(annee: number): void {
  if (!Number.isInteger(annee) || annee < 2000 || annee > 2999) {
    throw new BadRequestException(
      "L'année doit être un entier compris entre 2000 et 2999.",
    );
  }
}

/** Formate une référence sociale sans accès à la base de données. */
export function formaterRefSociale(annee: number, numero: number): string {
  validerAnnee(annee);

  if (!Number.isInteger(numero) || numero < 1) {
    throw new BadRequestException(
      'Le numéro séquentiel doit être un entier supérieur ou égal à 1.',
    );
  }

  const anneeCourte = String(annee % 100).padStart(2, '0');
  const numeroFormate = String(numero).padStart(3, '0');

  return `F${anneeCourte}/${numeroFormate}`;
}
