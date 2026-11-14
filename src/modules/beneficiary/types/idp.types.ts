export const CodeFamille = {
  AGENT: 'AGENT',
  CONJOINT: 'CONJOINT',
  ENFANT: 'ENFANT',
} as const;
export type CodeFamille = (typeof CodeFamille)[keyof typeof CodeFamille];

export const SUFFIXE_CODE: Record<CodeFamille, string> = {
  AGENT: 'AGT',
  CONJOINT: 'CJT',
  ENFANT: 'EFT',
};
