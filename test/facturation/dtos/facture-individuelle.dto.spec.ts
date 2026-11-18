import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreerFactureIndividuelleDto } from '../../../src/modules/facturation/dtos/facture-individuelle.dto.js';

describe('CreerFactureIndividuelleDto.numPec', () => {
  const payload = {
    libelle: 'Consultation',
    dateActe: '2026-01-15',
    idp: 'IDP-09',
    acteId: 3,
    montantActe: 100_000,
  };

  it('accepte un identifiant Attestation entier', () => {
    const dto = plainToInstance(CreerFactureIndividuelleDto, {
      ...payload,
      numPec: 73,
    });

    expect(validateSync(dto)).toEqual([]);
  });

  it('refuse une chaîne pour numPec', () => {
    const dto = plainToInstance(CreerFactureIndividuelleDto, {
      ...payload,
      numPec: '73',
    });

    expect(validateSync(dto).some((error) => error.property === 'numPec')).toBe(
      true,
    );
  });

  it('accepte les champs facultatifs de paie dans le payload de création', () => {
    const dto = plainToInstance(CreerFactureIndividuelleDto, {
      ...payload,
      refPaie: 'PAIE-MARS-2026-01',
      moisAffectation: '2026-03-01',
    });

    expect(validateSync(dto)).toEqual([]);
  });

  it('refuse une date invalide pour moisAffectation', () => {
    const dto = plainToInstance(CreerFactureIndividuelleDto, {
      ...payload,
      moisAffectation: '2026-13-01',
    });

    expect(
      validateSync(dto).some((error) => error.property === 'moisAffectation'),
    ).toBe(true);
  });
});
