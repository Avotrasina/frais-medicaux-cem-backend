import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiProduces,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { obtenirUtilisateurId } from '../shared/utilisateur-facture.js';
import type { RequeteAvecUtilisateur } from '../shared/utilisateur-facture.js';
import { PieceJointeFactureService } from './piece-jointe-facture.service.js';
import { PieceJointeFactureResponseDto } from '../dtos/piece-jointe-response.dto.js';

const TAILLE_MAX_OCTETS = 10 * 1024 * 1024;

@ApiTags('Pièces jointes')
@Controller('factures/:id/pieces-jointes')
export class PieceJointeFactureController {
  constructor(private readonly piecesJointes: PieceJointeFactureService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: PieceJointeFactureResponseDto })
  @UseInterceptors(
    FileInterceptor('fichier', {
      storage: memoryStorage(),
      limits: { fileSize: TAILLE_MAX_OCTETS, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['fichier'],
      properties: {
        fichier: {
          type: 'string',
          format: 'binary',
          description: 'PDF, JPEG ou PNG (10 Mo maximum).',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Ajouter une pièce jointe à une facture',
    description:
      'Le contenu PDF/JPEG/PNG est vérifié par signature. Maximum 20 pièces jointes par facture.',
  })
  @ApiResponse({
    status: 400,
    description: 'Fichier manquant ou multipart invalide.',
  })
  @ApiResponse({
    status: 409,
    description: 'Facture supprimée ou quota atteint.',
  })
  @ApiResponse({ status: 413, description: 'Fichier supérieur à 10 Mo.' })
  @ApiResponse({ status: 422, description: 'Signature ou type MIME invalide.' })
  async ajouter(
    @Param('id', ParseIntPipe) factureId: number,
    @UploadedFile() fichier: Express.Multer.File | undefined,
    @Req() requete: RequeteAvecUtilisateur,
  ): Promise<PieceJointeFactureResponseDto> {
    if (fichier === undefined) {
      throw new BadRequestException('Le champ fichier est obligatoire.');
    }
    return this.piecesJointes.ajouter(
      factureId,
      obtenirUtilisateurId(requete),
      fichier,
    );
  }

  @Get()
  @ApiOkResponse({ type: PieceJointeFactureResponseDto, isArray: true })
  @ApiOperation({
    summary: 'Lister les pièces jointes d’une facture',
    description: 'Retourne les métadonnées des fichiers associés à la facture.',
  })
  async lister(
    @Param('id', ParseIntPipe) factureId: number,
  ): Promise<PieceJointeFactureResponseDto[]> {
    return this.piecesJointes.lister(factureId);
  }

  @Get(':pieceId')
  @ApiProduces('application/pdf', 'image/jpeg', 'image/png')
  @ApiOkResponse({
    description: 'Fichier PDF, JPEG ou PNG diffusé en ligne.',
    schema: { type: 'string', format: 'binary' },
  })
  @ApiOperation({
    summary: 'Ouvrir une pièce jointe de la facture',
    description: 'Diffuse le fichier PDF, JPEG ou PNG demandé.',
  })
  @ApiResponse({ status: 404, description: 'Pièce jointe introuvable.' })
  async ouvrir(
    @Param('id', ParseIntPipe) factureId: number,
    @Param('pieceId', ParseIntPipe) pieceId: number,
    @Res() reponse: Response,
  ): Promise<void> {
    const piece = await this.piecesJointes.obtenir(factureId, pieceId);
    const flux = await this.piecesJointes.ouvrir(piece);
    const nom = this.nettoyerNomPourEntete(piece.nomFichier ?? 'fichier');
    const nomAscii = nom.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
    reponse.setHeader('Content-Type', piece.typeFichier);
    reponse.setHeader(
      'Content-Disposition',
      `inline; filename="${nomAscii}"; filename*=UTF-8''${encodeURIComponent(nom)}`,
    );
    reponse.setHeader('X-Content-Type-Options', 'nosniff');
    flux.pipe(reponse);
  }

  @Delete(':pieceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer une pièce jointe modifiable',
    description:
      'Supprime un fichier lorsque le statut de la facture l’autorise.',
  })
  @ApiNoContentResponse({ description: 'Pièce jointe supprimée.' })
  @ApiResponse({
    status: 409,
    description:
      'La suppression est autorisée uniquement en ENREGISTREE, A_CORRIGER ou RETOURNEE.',
  })
  @ApiResponse({ status: 404, description: 'Pièce jointe introuvable.' })
  async supprimer(
    @Param('id', ParseIntPipe) factureId: number,
    @Param('pieceId', ParseIntPipe) pieceId: number,
  ): Promise<void> {
    await this.piecesJointes.supprimer(factureId, pieceId);
  }

  private nettoyerNomPourEntete(nom: string): string {
    return (
      nom
        .replace(/[\\/]/g, '_')
        .replace(/\p{Cc}/gu, '')
        .trim() || 'fichier'
    );
  }
}
