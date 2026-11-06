import type { PieceJointeFacture } from '../../../src/generated/prisma/client.js';
import { PieceJointeFactureController } from '../../../src/modules/facturation/pieces-jointes/piece-jointe-facture.controller.js';
import { PieceJointeFactureService } from '../../../src/modules/facturation/pieces-jointes/piece-jointe-facture.service.js';

vi.hoisted(() => {
  process.env.NODE_ENV = 'development';
});

function fichier(): Express.Multer.File {
  const buffer = Buffer.from('%PDF-1.7');
  return {
    fieldname: 'fichier',
    originalname: 'facture.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: buffer.length,
    buffer,
  } as Express.Multer.File;
}

describe('PieceJointeFactureController', () => {
  it('transmet la facture, le fichier et l’utilisateur courant au service', async () => {
    const piece = { id: 8, typeFichier: 'application/pdf' };
    const service = {
      ajouter: vi.fn().mockResolvedValue(piece),
    };
    const controller = new PieceJointeFactureController(
      service as unknown as PieceJointeFactureService,
    );

    await expect(
      controller.ajouter(21, fichier(), { user: { id: 5 } }),
    ).resolves.toBe(piece);
    expect(service.ajouter).toHaveBeenCalledWith(21, 5, fichier());
  });

  it('sert la pièce en inline avec son type détecté et un nom d’entête nettoyé', async () => {
    const stream = { pipe: vi.fn() };
    const piece = {
      id: 8,
      nomFichier: 'facture "été".pdf',
      typeFichier: 'application/pdf',
    } as PieceJointeFacture;
    const service = {
      obtenir: vi.fn().mockResolvedValue(piece),
      ouvrir: vi.fn().mockResolvedValue(stream),
    };
    const controller = new PieceJointeFactureController(
      service as unknown as PieceJointeFactureService,
    );
    const reponse = { setHeader: vi.fn() };

    await controller.ouvrir(21, 8, reponse as never);

    expect(service.obtenir).toHaveBeenCalledWith(21, 8);
    expect(reponse.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/pdf',
    );
    expect(reponse.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      expect.stringContaining('inline;'),
    );
    expect(stream.pipe).toHaveBeenCalledWith(reponse);
  });

  it('délègue la liste et la suppression au service', async () => {
    const service = {
      lister: vi.fn().mockResolvedValue([]),
      supprimer: vi.fn().mockResolvedValue(undefined),
    };
    const controller = new PieceJointeFactureController(
      service as unknown as PieceJointeFactureService,
    );

    await expect(controller.lister(21)).resolves.toEqual([]);
    await expect(controller.supprimer(21, 8)).resolves.toBeUndefined();
    expect(service.lister).toHaveBeenCalledWith(21);
    expect(service.supprimer).toHaveBeenCalledWith(21, 8);
  });
});
