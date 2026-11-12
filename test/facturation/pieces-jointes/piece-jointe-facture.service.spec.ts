import { ConflictException, NotFoundException } from '@nestjs/common';
import { StatutFacture } from '../../../src/generated/prisma/enums.js';
import { PrismaService } from '../../../src/infrastructure/prisma/prisma.service.js';
import { FileStorageService } from '../../../src/infrastructure/storage/file-storage.service.js';
import { PieceJointeFactureService } from '../../../src/modules/facturation/pieces-jointes/piece-jointe-facture.service.js';

vi.hoisted(() => {
  process.env.NODE_ENV = 'development';
});

vi.mock('../../../src/infrastructure/prisma/prisma.service.js', () => ({
  PrismaService: class PrismaService {},
}));

const signatures = {
  'application/pdf': Buffer.from('%PDF-1.7\n'),
  'image/jpeg': Buffer.from([0xff, 0xd8, 0xff, 0x00]),
  'image/png': Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]),
} as const;

function fichier(
  typeFichier: keyof typeof signatures,
  modifications: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  const buffer = signatures[typeFichier];
  return {
    fieldname: 'fichier',
    originalname: `dossier\\facture.${typeFichier === 'application/pdf' ? 'pdf' : typeFichier === 'image/jpeg' ? 'jpg' : 'png'}`,
    encoding: '7bit',
    mimetype: typeFichier,
    size: buffer.length,
    buffer,
    ...modifications,
  } as Express.Multer.File;
}

function creerContexte(
  statut = StatutFacture.ENREGISTREE,
  options: {
    nombrePieces?: number;
    echecInsertion?: Error;
    echecSuppressionFichier?: Error;
  } = {},
) {
  const pieces: Array<Record<string, unknown> & { id: number }> = [];
  const facture = { id: 21, statut };
  const stockage = {
    saveFacturePdf: vi.fn().mockResolvedValue('pdf/factures/uuid.pdf'),
    saveFactureImage: vi.fn(async ({ mimetype }: { mimetype: string }) =>
      mimetype === 'image/jpeg'
        ? 'images/factures/uuid.jpg'
        : 'images/factures/uuid.png',
    ),
    deleteStoredFile: vi.fn(async () => {
      if (options.echecSuppressionFichier !== undefined) {
        throw options.echecSuppressionFichier;
      }
    }),
    openStoredFile: vi.fn().mockResolvedValue(null),
  };
  const tx = {
    $queryRaw: vi.fn().mockResolvedValue([{ id: facture.id }]),
    factureGlobale: {
      findUnique: vi.fn(async ({ where }: { where: { id: number } }) =>
        where.id === facture.id ? facture : null,
      ),
    },
    pieceJointeFacture: {
      count: vi.fn(async () => options.nombrePieces ?? pieces.length),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        if (options.echecInsertion !== undefined) throw options.echecInsertion;
        const piece = {
          ...data,
          id: pieces.length + 1,
          createdAt: new Date('2026-11-06T08:00:00.000Z'),
          ajoutePar: { id: data.ajouteParId, nom: 'Opérateur' },
        };
        pieces.push(piece);
        return piece;
      }),
      findMany: vi.fn(async () =>
        pieces.map((piece) => ({
          ...piece,
          ajoutePar: { id: 5, nom: 'Opérateur' },
        })),
      ),
      findFirst: vi.fn(
        async ({
          where,
        }: {
          where: { id: number; factureGlobaleId: number };
        }) =>
          where.factureGlobaleId === facture.id
            ? (pieces.find(({ id }) => id === where.id) ?? null)
            : null,
      ),
      delete: vi.fn(async ({ where }: { where: { id: number } }) => {
        const index = pieces.findIndex(({ id }) => id === where.id);
        const [piece] = pieces.splice(index, 1);
        return piece;
      }),
    },
  };
  const prisma = {
    $transaction: vi.fn(
      async <T>(callback: (transaction: typeof tx) => Promise<T>) =>
        callback(tx),
    ),
    factureGlobale: {
      findUnique: vi.fn(async ({ where }: { where: { id: number } }) =>
        where.id === facture.id ? facture : null,
      ),
    },
    pieceJointeFacture: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
    },
  };
  const service = new PieceJointeFactureService(
    prisma as unknown as PrismaService,
    stockage as unknown as FileStorageService,
  );
  return { service, prisma, tx, stockage, pieces, facture };
}

describe('Pièces jointes de facture', () => {
  it.each([
    ['PDF', 'application/pdf'],
    ['JPEG', 'image/jpeg'],
    ['PNG', 'image/png'],
  ] as const)(
    'accepte un fichier %s valide et enregistre ses métadonnées',
    async (_nom, typeFichier) => {
      const { service, stockage, tx } = creerContexte();
      const resultat = await service.ajouter(21, 5, fichier(typeFichier));

      expect(resultat).toMatchObject({
        id: 1,
        nomFichier: typeFichier === 'application/pdf'
          ? 'facture.pdf'
          : typeFichier === 'image/jpeg'
            ? 'facture.jpg'
            : 'facture.png',
        typeFichier,
        tailleOctets: signatures[typeFichier].length,
        ajoutePar: { id: 5, nom: 'Opérateur' },
      });
      expect(tx.$queryRaw).toHaveBeenCalledOnce();
      expect(tx.pieceJointeFacture.create).toHaveBeenCalledOnce();
      expect(stockage.deleteStoredFile).not.toHaveBeenCalled();
    },
  );

  it('refuse un fichier nommé PDF si le contenu ne porte pas la signature PDF', async () => {
    const { service, stockage } = creerContexte();

    await expect(
      service.ajouter(
        21,
        5,
        fichier('application/pdf', {
          buffer: Buffer.from('texte non PDF'),
          size: 13,
        }),
      ),
    ).rejects.toThrow('Le contenu doit être un PDF');

    expect(stockage.saveFacturePdf).not.toHaveBeenCalled();
  });

  it('refuse un MIME déclaré différent de la signature réelle', async () => {
    const { service } = creerContexte();

    await expect(
      service.ajouter(
        21,
        5,
        fichier('image/png', { mimetype: 'image/jpeg' }),
      ),
    ).rejects.toThrow('Le type MIME déclaré ne correspond pas');
  });

  it('refuse un fichier supérieur à 10 Mo avant écriture', async () => {
    const { service, stockage } = creerContexte();
    const buffer = Buffer.concat([
      signatures['application/pdf'],
      Buffer.alloc(10 * 1024 * 1024),
    ]);

    await expect(
      service.ajouter(
        21,
        5,
        fichier('application/pdf', {
          buffer,
          size: buffer.length,
        }),
      ),
    ).rejects.toMatchObject({ status: 413 });
    expect(stockage.saveFacturePdf).not.toHaveBeenCalled();
  });

  it('refuse la 21e pièce jointe et supprime le fichier temporairement écrit', async () => {
    const { service, stockage } = creerContexte(StatutFacture.ENREGISTREE, {
      nombrePieces: 20,
    });

    await expect(
      service.ajouter(21, 5, fichier('application/pdf')),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(stockage.deleteStoredFile).toHaveBeenCalledWith(
      'pdf/factures/uuid.pdf',
    );
  });

  it.each([StatutFacture.VALIDEE, StatutFacture.SORTIE])(
    'autorise l’ajout au statut %s sans changer le statut',
    async (statut) => {
      const { service, facture, tx } = creerContexte(statut);

      await service.ajouter(21, 5, fichier('application/pdf'));

      expect(facture.statut).toBe(statut);
      expect(tx.factureGlobale.findUnique).toHaveBeenCalledWith({
        where: { id: 21 },
        select: { id: true, statut: true },
      });
    },
  );

  it('refuse l’ajout sur une facture SUPPRIMEE et nettoie le fichier', async () => {
    const { service, stockage } = creerContexte(StatutFacture.SUPPRIMEE);

    await expect(
      service.ajouter(21, 5, fichier('application/pdf')),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(stockage.deleteStoredFile).toHaveBeenCalledOnce();
  });

  it('refuse la suppression après validation sans effacer le fichier', async () => {
    const { service, stockage } = creerContexte(StatutFacture.VALIDEE);

    await expect(service.supprimer(21, 8)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(stockage.deleteStoredFile).not.toHaveBeenCalled();
  });

  it('ne trouve pas une pièce jointe rattachée à une autre facture', async () => {
    const { service } = creerContexte();

    await expect(service.obtenir(22, 8)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('supprime le fichier si la transaction échoue à insérer la pièce', async () => {
    const erreurInsertion = new Error('échec base');
    const { service, stockage } = creerContexte(
      StatutFacture.ENREGISTREE,
      { echecInsertion: erreurInsertion },
    );

    await expect(
      service.ajouter(21, 5, fichier('application/pdf')),
    ).rejects.toBe(erreurInsertion);
    expect(stockage.deleteStoredFile).toHaveBeenCalledWith(
      'pdf/factures/uuid.pdf',
    );
  });

  it('ne fait pas échouer la suppression en base si le fichier ne peut être effacé', async () => {
    const { service, stockage, pieces } = creerContexte();
    const piece = await service.ajouter(21, 5, fichier('application/pdf'));
    stockage.deleteStoredFile.mockClear();
    stockage.deleteStoredFile.mockRejectedValue(new Error('disque indisponible'));

    await expect(service.supprimer(21, piece.id)).resolves.toBeUndefined();
    expect(pieces).toHaveLength(0);
    expect(stockage.deleteStoredFile).toHaveBeenCalledWith(
      'pdf/factures/uuid.pdf',
    );
  });

  it('ignore l’existence d’une pièce d’une autre facture lors de la suppression', async () => {
    const { service, stockage } = creerContexte();

    await expect(service.supprimer(21, 99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(stockage.deleteStoredFile).not.toHaveBeenCalled();
  });
});
