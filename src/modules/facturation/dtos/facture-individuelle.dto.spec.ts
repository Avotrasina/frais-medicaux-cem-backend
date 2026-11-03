import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreerFactureIndividuelleDto } from './facture-individuelle.dto.js';

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
});
