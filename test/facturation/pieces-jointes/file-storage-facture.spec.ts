import { BadRequestException } from '@nestjs/common';

const fsMock = vi.hoisted(() => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(Buffer.from('%PDF-1.7')),
  unlink: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  stat: vi.fn().mockResolvedValue({ isFile: () => true }),
  createReadStream: vi.fn().mockReturnValue({ pipe: vi.fn() }),
}));

vi.mock('node:fs/promises', () => ({
  mkdir: fsMock.mkdir,
  readFile: fsMock.readFile,
  unlink: fsMock.unlink,
  writeFile: fsMock.writeFile,
  stat: fsMock.stat,
}));

vi.mock('node:fs', () => ({
  createReadStream: fsMock.createReadStream,
}));

vi.mock('../../../src/common/settings/storage.settings.js', () => ({
  STORAGE_SETTINGS: {
    root: process.cwd(),
    imagesDir: 'images',
    imageSubDirs: {
      carteProfessionnelle: 'cartes-professionnelles',
      carteSociale: 'cartes-sociales',
      factures: 'factures',
    },
    pdfDir: 'pdf',
    pdfDirs: {
      attestation: 'attestations',
      convention: 'conventions',
      factures: 'factures',
    },
  },
  IMAGE_EXTENSION_BY_MIME: {
    'image/jpeg': '.jpg',
    'image/png': '.png',
  },
}));

import { FileStorageService } from '../../../src/infrastructure/storage/file-storage.service.js';

describe('FileStorageService pour les pièces jointes de facture', () => {
  const stockage = new FileStorageService();

  beforeEach(() => {
    vi.clearAllMocks();
    fsMock.mkdir.mockResolvedValue(undefined);
    fsMock.writeFile.mockResolvedValue(undefined);
    fsMock.stat.mockResolvedValue({ isFile: () => true });
    fsMock.unlink.mockResolvedValue(undefined);
  });

  it('enregistre un PDF dans la catégorie factures sous un UUID .pdf', async () => {
    const chemin = await stockage.saveFacturePdf(Buffer.from('%PDF-1.7'));

    expect(chemin).toMatch(/^pdf\/factures\/[0-9a-f-]{36}\.pdf$/i);
    expect(fsMock.writeFile).toHaveBeenCalledWith(
      expect.stringContaining(chemin.replace(/\//g, '\\')),
      expect.any(Buffer),
    );
  });

  it('enregistre un JPEG dans la catégorie factures sous un UUID .jpg', async () => {
    const chemin = await stockage.saveFactureImage({
      buffer: Buffer.from([0xff, 0xd8, 0xff]),
      mimetype: 'image/jpeg',
    });

    expect(chemin).toMatch(/^images\/factures\/[0-9a-f-]{36}\.jpg$/i);
  });

  it('refuse la lecture et la suppression hors de la racine de stockage', async () => {
    await expect(stockage.openStoredFile('../hors-racine.pdf')).resolves.toBeNull();
    await expect(
      stockage.deleteStoredFile('../hors-racine.pdf'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(fsMock.stat).not.toHaveBeenCalled();
    expect(fsMock.unlink).not.toHaveBeenCalled();
  });

  it('ouvre le flux d’un fichier stocké à l’intérieur de la racine', async () => {
    const flux = await stockage.openStoredFile('pdf/factures/fichier.pdf');

    expect(flux).toBeDefined();
    expect(fsMock.stat).toHaveBeenCalledOnce();
    expect(fsMock.createReadStream).toHaveBeenCalledOnce();
  });
});
