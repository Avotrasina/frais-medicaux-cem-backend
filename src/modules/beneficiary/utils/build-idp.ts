import { CodeFamille, SUFFIXE_CODE } from '../types/idp.types.js';

function assertEntierPositif(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(
      `${label} must be a non-negative integer (received: ${value})`,
    );
  }
}

function formatMatricule(matricule: number): string {
  assertEntierPositif(matricule, 'employee ID');
  return String(matricule).padStart(3, '0');
}

function formatNumero(numero: number): string {
  assertEntierPositif(numero, 'number');
  if (numero > 99) {
    throw new Error(`number must be between 0 and 999 (received: ${numero})`);
  }
  return String(numero).padStart(2, '0');
}

export function buildCodeFamille(
  matricule: number,
  codeFamille: CodeFamille,
  numEnfant?: number,
  numConjoint?: number,
): string {
  let num: number;

  switch (codeFamille) {
    case CodeFamille.AGENT:
      num = 1;
      break;
    case CodeFamille.CONJOINT:
      if (numConjoint == null) {
        throw new Error('numConjoint is required for a spouse');
      }
      num = numConjoint;
      break;
    case CodeFamille.ENFANT:
      if (numEnfant == null) {
        throw new Error('numEnfant is required for a child');
      }
      num = numEnfant;
      break;
  }

  return `${formatMatricule(matricule)}${SUFFIXE_CODE[codeFamille]}${formatNumero(num)}`;
}
