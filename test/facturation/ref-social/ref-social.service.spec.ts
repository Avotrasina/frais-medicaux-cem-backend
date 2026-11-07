import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '../../../src/generated/prisma/client.js';
import { RefSocialService } from '../../../src/modules/facturation/shared/ref-social.service.js';

type RequeteCompteur = (
  morceaux: TemplateStringsArray,
  anneeParametree: number,
  ) => Promise<Array<{ dernier_numero: number }>>;

describe('RefSocialService', () => {
  let service: RefSocialService;
  let requeteCompteur: ReturnType<typeof vi.fn<RequeteCompteur>>;
  let tx: Prisma.TransactionClient;

  beforeEach(() => {
    service = new RefSocialService();
    requeteCompteur = vi.fn<RequeteCompteur>(async () => [
      { dernier_numero: 1 },
    ]);
    tx = { $queryRaw: requeteCompteur } as unknown as Prisma.TransactionClient;
  });

  it('incrémente le compteur dans la transaction reçue et formate la référence', async () => {
    await expect(service.genererProchaine(tx, 2026)).resolves.toBe('F26/001');

    expect(requeteCompteur).toHaveBeenCalledTimes(1);
    const appel = requeteCompteur.mock.calls[0];
    expect(appel?.[1]).toBe(2026);
    const requete = appel?.[0].join(' ');
    expect(requete).toContain('"facturation"."compteur_ref_sociale"');
    expect(requete).toContain('"dernier_numero"');
    expect(requete).toContain('ON CONFLICT ("annee") DO UPDATE');
  });

  it('conserve les numéros supérieurs à 999 sans troncature', async () => {
    requeteCompteur.mockResolvedValue([{ dernier_numero: 1000 }]);

    await expect(service.genererProchaine(tx, 2026)).resolves.toBe('F26/1000');
  });

  it.each([1999, 3000, 2026.5, Number.NaN])(
    'rejette une année invalide avant toute requête : %s',
    async (annee) => {
      await expect(service.genererProchaine(tx, annee)).rejects.toThrow(
        BadRequestException,
      );
      expect(requeteCompteur).not.toHaveBeenCalled();
    },
  );
});
