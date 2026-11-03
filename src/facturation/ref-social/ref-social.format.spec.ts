import { BadRequestException } from '@nestjs/common';
import { formaterRefSociale } from './ref-social.format.js';

describe('formaterRefSociale', () => {
  it.each([
    [2026, 1, 'F26/001'],
    [2026, 2, 'F26/002'],
    [2026, 10, 'F26/010'],
    [2026, 123, 'F26/123'],
    [2026, 1000, 'F26/1000'],
  ])('formate %i et %i en %s', (annee, numero, attendu) => {
    expect(formaterRefSociale(annee, numero)).toBe(attendu);
  });

  it.each([1999, 3000, 2026.5, Number.NaN])(
    'rejette une année invalide : %s',
    (annee) => {
      expect(() => formaterRefSociale(annee, 1)).toThrow(BadRequestException);
    },
  );

  it.each([0, -1, 1.5, Number.NaN])(
    'rejette un numéro séquentiel invalide : %s',
    (numero) => {
      expect(() => formaterRefSociale(2026, numero)).toThrow(
        BadRequestException,
      );
    },
  );
});
