import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type {
  PieceJointeFacture,
  Prisma,
} from '../../../generated/prisma/client.js';
import { StatutFacture } from '../../../generated/prisma/enums.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { FileStorageService } from '../../../infrastructure/storage/file-storage.service.js';
import { FactureClotureService } from '../shared/facture-cloture.service.js';

const TAILLE_MAX_OCTETS = 10 * 1024 * 1024;
const NOMBRE_MAX_PIECES = 20;

const MIME_EXTENSION: Readonly<Record<string, string>> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
};

type PieceJointeAvecAuteur = Prisma.PieceJointeFactureGetPayload<{
  include: { ajoutePar: { select: { id: true; nom: true } } };
}>;

export type PieceJointeFactureVue = Pick<
  PieceJointeAvecAuteur,
  'id' | 'nomFichier' | 'typeFichier' | 'tailleOctets' | 'createdAt'
> & {
  ajoutePar: { id: number; nom: string } | null;
};

@Injectable()
export class PieceJointeFactureService {
  private readonly logger = new Logger(PieceJointeFactureService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stockage: FileStorageService,
    private readonly cloture: FactureClotureService = new FactureClotureService(),
  ) {}

  async ajouter(
    factureId: number,
    ajouteParId: number,
    fichier: Express.Multer.File,
  ): Promise<PieceJointeFactureVue> {
    if (fichier.buffer.length > TAILLE_MAX_OCTETS) {
      throw new PayloadTooLargeException(
        'La pièce jointe ne peut pas dépasser 10 Mo.',
      );
    }

    const typeFichier = this.detecterType(fichier);
    const nomFichier = this.nettoyerNom(
      fichier.originalname,
      MIME_EXTENSION[typeFichier],
    );
    const path =
      typeFichier === 'application/pdf'
        ? await this.stockage.saveFacturePdf(fichier.buffer)
        : await this.stockage.saveFactureImage({
            buffer: fichier.buffer,
            mimetype: typeFichier,
          });

    try {
      const piece = await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw<{ id: number }[]>`
          SELECT "id"
          FROM "facturation"."facture_globale"
          WHERE "id" = ${factureId}
          FOR UPDATE
        `;

        const facture = await tx.factureGlobale.findUnique({
          where: { id: factureId },
          select: { id: true, statut: true },
        });
        if (facture === null) {
          throw new NotFoundException(
            `La facture ${factureId} est introuvable.`,
          );
        }
        if (facture.statut === StatutFacture.SUPPRIMEE) {
          throw new ConflictException(
            'Une facture supprimée ne peut pas recevoir de pièce jointe.',
          );
        }

        const nombrePieces = await tx.pieceJointeFacture.count({
          where: { factureGlobaleId: factureId },
        });
        if (nombrePieces >= NOMBRE_MAX_PIECES) {
          throw new ConflictException(
            `Une facture ne peut pas contenir plus de ${NOMBRE_MAX_PIECES} pièces jointes.`,
          );
        }

        return tx.pieceJointeFacture.create({
          data: {
            factureGlobaleId: factureId,
            path,
            nomFichier,
            typeFichier,
            tailleOctets: fichier.buffer.length,
            ajouteParId,
          },
          include: { ajoutePar: { select: { id: true, nom: true } } },
        });
      });
      return this.formater(piece);
    } catch (error: unknown) {
      try {
        await this.stockage.deleteStoredFile(path);
      } catch (erreurNettoyage: unknown) {
        this.logger.error(
          `Impossible de nettoyer le fichier ${path} après échec d’insertion.`,
          erreurNettoyage instanceof Error
            ? erreurNettoyage.stack
            : String(erreurNettoyage),
        );
      }
      throw error;
    }
  }

  async lister(factureId: number): Promise<PieceJointeFactureVue[]> {
    await this.verifierFactureExiste(factureId);
    const pieces = await this.prisma.pieceJointeFacture.findMany({
      where: { factureGlobaleId: factureId },
      include: { ajoutePar: { select: { id: true, nom: true } } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return pieces.map((piece) => this.formater(piece));
  }

  async obtenir(
    factureId: number,
    pieceId: number,
  ): Promise<PieceJointeFacture> {
    const piece = await this.prisma.pieceJointeFacture.findFirst({
      where: { id: pieceId, factureGlobaleId: factureId },
    });
    if (piece === null) {
      throw new NotFoundException(
        `La pièce jointe ${pieceId} est introuvable dans la facture ${factureId}.`,
      );
    }
    return piece;
  }

  async supprimer(factureId: number, pieceId: number): Promise<void> {
    const pieceASupprimer = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw<{ id: number }[]>`
        SELECT "id"
        FROM "facturation"."facture_globale"
        WHERE "id" = ${factureId}
        FOR UPDATE
      `;
      const facture = await tx.factureGlobale.findUnique({
        where: { id: factureId },
        select: { id: true, statut: true, dateCloture: true },
      });
      if (facture === null) {
        throw new NotFoundException(`La facture ${factureId} est introuvable.`);
      }
      this.cloture.verifierNonCloturee(facture.dateCloture);
      const statutsAutorisantSuppression: StatutFacture[] = [
        StatutFacture.ENREGISTREE,
        StatutFacture.A_CORRIGER,
        StatutFacture.RETOURNEE,
      ];
      if (!statutsAutorisantSuppression.includes(facture.statut)) {
        throw new ConflictException(
          'Les pièces jointes ne peuvent être supprimées que si la facture est ENREGISTREE, A_CORRIGER ou RETOURNEE.',
        );
      }
      const piece = await tx.pieceJointeFacture.findFirst({
        where: { id: pieceId, factureGlobaleId: factureId },
      });
      if (piece === null) {
        throw new NotFoundException(
          `La pièce jointe ${pieceId} est introuvable dans la facture ${factureId}.`,
        );
      }
      await tx.pieceJointeFacture.delete({ where: { id: piece.id } });
      return piece;
    });

    try {
      await this.stockage.deleteStoredFile(pieceASupprimer.path);
    } catch (error: unknown) {
      this.logger.warn(
        `La pièce jointe ${pieceId} a été supprimée en base, mais le fichier ${pieceASupprimer.path} n’a pas pu être supprimé : ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async ouvrir(piece: PieceJointeFacture) {
    const flux = await this.stockage.openStoredFile(piece.path);
    if (flux === null) {
      throw new NotFoundException(
        `Le fichier de la pièce jointe ${piece.id} est introuvable.`,
      );
    }
    return flux;
  }

  private detecterType(fichier: Express.Multer.File): string {
    const signature = fichier.buffer.subarray(0, 8);
    const type =
      signature.subarray(0, 5).toString('ascii') === '%PDF-'
        ? 'application/pdf'
        : signature.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
          ? 'image/jpeg'
          : signature
                .subarray(0, 8)
                .equals(
                  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
                )
            ? 'image/png'
            : undefined;

    if (type === undefined) {
      throw new UnprocessableEntityException(
        'Le contenu doit être un PDF, un JPEG ou un PNG valide.',
      );
    }
    if (fichier.mimetype !== type) {
      throw new UnprocessableEntityException(
        'Le type MIME déclaré ne correspond pas au contenu du fichier.',
      );
    }
    return type;
  }

  private nettoyerNom(nomOrigine: string, extension: string): string {
    const nomSansChemin = nomOrigine.replace(/\\/g, '/').split('/').pop() ?? '';
    const nom = nomSansChemin
      .replace(/\p{Cc}/gu, '')
      .trim()
      .slice(0, 255);
    return nom === '' ? `fichier${extension}` : nom;
  }

  private formater(piece: PieceJointeAvecAuteur): PieceJointeFactureVue {
    return {
      id: piece.id,
      nomFichier: piece.nomFichier,
      typeFichier: piece.typeFichier,
      tailleOctets: piece.tailleOctets,
      createdAt: piece.createdAt,
      ajoutePar: piece.ajoutePar,
    };
  }

  private async verifierFactureExiste(factureId: number): Promise<void> {
    const facture = await this.prisma.factureGlobale.findUnique({
      where: { id: factureId },
      select: { id: true },
    });
    if (facture === null) {
      throw new NotFoundException(`La facture ${factureId} est introuvable.`);
    }
  }
}
