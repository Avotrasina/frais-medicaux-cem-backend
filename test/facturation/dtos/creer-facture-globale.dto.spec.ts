import { validate } from 'class-validator';
import { CreerFactureGlobaleDto } from '../../../src/modules/facturation/dtos/creer-facture-globale.dto.js';

describe('CreerFactureGlobaleDto', () => {
  function creerDonneesValides(): CreerFactureGlobaleDto {
    return Object.assign(new CreerFactureGlobaleDto(), {
      prestataireId: 7,
      numFacture: 'FAC-001',
      dateFacture: '2026-12-20',
      dateReception: '2026-12-31',
      moisPrestation: '2026-12-01',
      montantTotal: 6_000_000,
    });
  }

  it('accepte les champs métier attendus', async () => {
    await expect(validate(creerDonneesValides())).resolves.toHaveLength(0);
  });

  it('rejette un numéro de facture avec des espaces en début ou fin', async () => {
    const donnees = Object.assign(creerDonneesValides(), {
      numFacture: ' FAC-001 ',
    });

    await expect(validate(donnees)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'numFacture' }),
      ]),
    );
  });

  it('rejette les dates qui ne sont pas des dates ISO complètes', async () => {
    const donnees = Object.assign(creerDonneesValides(), {
      dateFacture: '20/12/2026',
    });

    await expect(validate(donnees)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'dateFacture' }),
      ]),
    );
  });

  it('rejette un montant avec plus de deux décimales', async () => {
    const donnees = Object.assign(creerDonneesValides(), {
      montantTotal: 12.345,
    });

    await expect(validate(donnees)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'montantTotal' }),
      ]),
    );
  });
});
