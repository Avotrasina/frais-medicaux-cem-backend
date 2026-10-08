import {
  CodeFamille,
  SUFFIXE_CODE,
} from "../types/idp.types.js";

function assertEntierPositif(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} doit être un entier positif (reçu : ${value})`);
  }
}

function formatMatricule(matricule: number): string {
  assertEntierPositif(matricule, "matricule");
  return String(matricule).padStart(3, "0");
}

function formatNumero(numero: number): string {
  assertEntierPositif(numero, "numéro");
  if (numero > 999) {
    throw new Error(`numéro doit être compris entre 0 et 999 (reçu : ${numero})`);
  }
  return String(numero).padStart(3, "0");
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
        throw new Error("numConjoint est requis pour un conjoint");
      }
      num = numConjoint;
      break;
    case CodeFamille.ENFANT:
      if (numEnfant == null) {
        throw new Error("numEnfant est requis pour un enfant");
      }
      num = numEnfant;
      break;
  }

  return `${formatMatricule(matricule)}${SUFFIXE_CODE[codeFamille]}${formatNumero(num)}`;
}