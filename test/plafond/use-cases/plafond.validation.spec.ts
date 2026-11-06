import { BadRequestException } from '@nestjs/common';
import { PorteePlafond, UnitePlafond } from '../../../src/generated/prisma/enums.js';
import { validatePlafond } from '../../../src/modules/plafond/use-cases/plafond.validation.js';

describe('validatePlafond', () => {
  it('accepts a positive amount ceiling owned by an act', () => {
    expect(() =>
      validatePlafond({
        unite: UnitePlafond.MONTANT,
        porteePlafond: PorteePlafond.PAR_ACTE,
        montant: '35000.00',
        nbSeances: null,
        acteID: 1,
        categorieActeID: null,
      }),
    ).not.toThrow();
  });

  it('accepts a positive session ceiling owned by a category', () => {
    expect(() =>
      validatePlafond({
        unite: UnitePlafond.SEANCES,
        porteePlafond: PorteePlafond.PAR_AN,
        montant: null,
        nbSeances: 2,
        acteID: null,
        categorieActeID: 1,
      }),
    ).not.toThrow();
  });

  it.each([
    { acteID: null, categorieActeID: null },
    { acteID: 1, categorieActeID: 1 },
  ])('requires exactly one owner: %o', ({ acteID, categorieActeID }) => {
    expect(() =>
      validatePlafond({
        unite: UnitePlafond.MONTANT,
        porteePlafond: PorteePlafond.PAR_AN,
        montant: 1,
        nbSeances: null,
        acteID,
        categorieActeID,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects a value that does not match the plafond unit', () => {
    expect(() =>
      validatePlafond({
        unite: UnitePlafond.MONTANT,
        porteePlafond: PorteePlafond.PAR_AN,
        montant: null,
        nbSeances: 2,
        acteID: 1,
        categorieActeID: null,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects non-positive ceiling values', () => {
    expect(() =>
      validatePlafond({
        unite: UnitePlafond.SEANCES,
        porteePlafond: PorteePlafond.PAR_AN,
        montant: null,
        nbSeances: 0,
        acteID: 1,
        categorieActeID: null,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects a session ceiling per act', () => {
    expect(() => validatePlafond({ unite: UnitePlafond.SEANCES, porteePlafond: PorteePlafond.PAR_ACTE, montant: null, nbSeances: 2, acteID: 1, categorieActeID: null })).toThrow(BadRequestException);
  });

  it('accepts a zero amount ceiling', () => {
    expect(() => validatePlafond({ unite: UnitePlafond.MONTANT, porteePlafond: PorteePlafond.PAR_AN, montant: 0, nbSeances: null, acteID: 1, categorieActeID: null })).not.toThrow();
  });
});
