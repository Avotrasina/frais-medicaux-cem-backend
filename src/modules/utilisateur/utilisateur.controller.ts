import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { basename, extname } from 'node:path';
import { ImageUploadInterceptor } from '../../common/interceptors/image-upload.interceptor.js';
import { createOptionalImageFilePipe } from '../../common/pipes/image-file.pipe.js';
import { RoleUtilisateur } from '../../generated/prisma/enums.js';
import { FileStorageService } from '../../infrastructure/storage/file-storage.service.js';
import {
  MessageResponseDto,
  UtilisateurReponseAvecMessageDto,
  UtilisateurResponseDto,
} from '../facturation/dtos/utilisateur-response.dto.js';
import {
  CreerUtilisateurDto,
  ModifierUtilisateurDto,
} from './dtos/utilisateur.dto.js';
import { UtilisateurService } from './utilisateur.service.js';

const ROLES_VALIDES = Object.values(RoleUtilisateur);
const VALIDATION_PAYLOAD = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});
const MIME_BY_EXT: Readonly<Record<string, string>> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

@ApiTags('Utilisateurs')
@Controller('utilisateurs')
export class UtilisateurController {
  constructor(
    private readonly utilisateurs: UtilisateurService,
    private readonly fileStorage: FileStorageService,
  ) {}

  @Get()
  @ApiOkResponse({ type: UtilisateurResponseDto, isArray: true })
  @ApiOperation({
    summary: 'Lister les utilisateurs',
    description:
      'Retourne les utilisateurs, avec un filtrage optionnel par rôle.',
  })
  lister(@Query('role') role?: string): Promise<UtilisateurResponseDto[]> {
    return this.utilisateurs.lister(this.validerRoles(role));
  }

  @Get(':id')
  @ApiOkResponse({ type: UtilisateurResponseDto })
  @ApiOperation({
    summary: 'Consulter un utilisateur',
    description: 'Retourne le détail de l’utilisateur demandé.',
  })
  obtenir(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UtilisateurResponseDto> {
    return this.utilisateurs.obtenir(id);
  }

  @Post()
  @ApiCreatedResponse({ type: UtilisateurReponseAvecMessageDto })
  @ApiOperation({
    summary: 'Créer un utilisateur',
    description: 'Crée un utilisateur avec ses informations et son rôle.',
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['nom', 'role', 'username', 'email', 'mdp'],
      properties: {
        nom: { type: 'string' },
        role: { type: 'string', enum: Object.values(RoleUtilisateur) },
        username: { type: 'string' },
        email: { type: 'string', format: 'email' },
        mdp: { type: 'string', format: 'password', writeOnly: true },
        profil: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(ImageUploadInterceptor('profil'))
  @UsePipes(VALIDATION_PAYLOAD)
  async creer(
    @Body() donnees: CreerUtilisateurDto,
    @UploadedFile(createOptionalImageFilePipe())
    image?: Express.Multer.File,
  ): Promise<UtilisateurReponseAvecMessageDto> {
    const profil = image
      ? await this.fileStorage.saveImage(image, 'profil')
      : undefined;
    try {
      return {
        message: "L'utilisateur a été créé avec succès.",
        utilisateur: await this.utilisateurs.creer({
          nom: donnees.nom,
          role: donnees.role,
          username: donnees.username,
          email: donnees.email,
          mdp: donnees.mdp,
          ...(profil === undefined ? {} : { profil }),
        }),
      };
    } catch (erreur: unknown) {
      if (profil !== undefined) await this.fileStorage.deleteImage(profil);
      throw erreur;
    }
  }

  @Patch(':id')
  @ApiOkResponse({ type: UtilisateurReponseAvecMessageDto })
  @ApiOperation({
    summary: 'Modifier un utilisateur',
    description: 'Met à jour les informations fournies pour un utilisateur.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nom: { type: 'string' },
        role: { type: 'string', enum: Object.values(RoleUtilisateur) },
        username: { type: 'string' },
        email: { type: 'string', format: 'email' },
        mdp: { type: 'string', format: 'password', writeOnly: true },
        profil: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(ImageUploadInterceptor('profil'))
  @UsePipes(VALIDATION_PAYLOAD)
  async modifier(
    @Param('id', ParseIntPipe) id: number,
    @Body() donnees: ModifierUtilisateurDto,
    @UploadedFile(createOptionalImageFilePipe())
    image?: Express.Multer.File,
  ): Promise<UtilisateurReponseAvecMessageDto> {
    const ancienProfil = image
      ? (await this.utilisateurs.obtenir(id)).profil
      : undefined;
    const nouveauProfil = image
      ? await this.fileStorage.saveImage(image, 'profil')
      : undefined;
    let utilisateur: UtilisateurResponseDto;
    try {
      utilisateur = await this.utilisateurs.modifier(id, {
        nom: donnees.nom,
        role: donnees.role,
        username: donnees.username,
        email: donnees.email,
        mdp: donnees.mdp,
        ...(nouveauProfil === undefined ? {} : { profil: nouveauProfil }),
      });
    } catch (erreur: unknown) {
      if (nouveauProfil !== undefined)
        await this.fileStorage.deleteImage(nouveauProfil);
      throw erreur;
    }
    if (
      ancienProfil !== undefined &&
      ancienProfil !== null &&
      nouveauProfil !== undefined
    ) {
      await this.fileStorage.deleteImage(ancienProfil);
    }
    return {
      message: "L'utilisateur a été modifié avec succès.",
      utilisateur,
    };
  }

  @Get(':id/profil')
  @ApiProduces('image/png', 'image/jpeg', 'image/webp')
  @ApiOkResponse({
    description: 'Image de profil de l’utilisateur.',
    schema: { type: 'string', format: 'binary' },
  })
  async obtenirProfil(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StreamableFile> {
    const { profil } = await this.utilisateurs.obtenir(id);
    if (profil === null) {
      throw new NotFoundException(
        `L'utilisateur ${id} n'a pas d'image de profil.`,
      );
    }
    const mimeType = MIME_BY_EXT[extname(profil).toLowerCase()];
    if (mimeType === undefined) {
      throw new NotFoundException('Le type de l’image de profil est invalide.');
    }
    const stream = await this.fileStorage.openImage(profil);
    if (stream === null) {
      throw new NotFoundException('L’image de profil est introuvable.');
    }
    return new StreamableFile(stream, {
      type: mimeType,
      disposition: `inline; filename="${basename(profil)}"`,
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer un utilisateur',
    description:
      'Supprime définitivement un utilisateur qui n’est plus utilisé.',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MessageResponseDto })
  async supprimer(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MessageResponseDto> {
    const utilisateur = await this.utilisateurs.obtenir(id);
    await this.utilisateurs.supprimer(id);
    if (utilisateur.profil !== null) {
      await this.fileStorage.deleteImage(utilisateur.profil);
    }
    return { message: "L'utilisateur a été supprimé avec succès." };
  }

  private validerRoles(role?: string): RoleUtilisateur[] | undefined {
    if (role === undefined) return undefined;
    const valeurs = role.split(',').map((valeur) => valeur.trim());
    if (
      valeurs.length === 0 ||
      valeurs.some(
        (valeur) => !ROLES_VALIDES.includes(valeur as RoleUtilisateur),
      )
    ) {
      throw new BadRequestException(
        'Le filtre role contient un rôle invalide.',
      );
    }
    return valeurs as RoleUtilisateur[];
  }
}
