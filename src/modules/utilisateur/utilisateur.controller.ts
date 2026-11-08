import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleUtilisateur } from '../../generated/prisma/enums.js';
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

@ApiTags('Utilisateurs')
@Controller('utilisateurs')
export class UtilisateurController {
  constructor(private readonly utilisateurs: UtilisateurService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les utilisateurs',
    description:
      'Retourne les utilisateurs, avec un filtrage optionnel par rôle.',
  })
  lister(@Query('role') role?: string) {
    return this.utilisateurs.lister(this.validerRoles(role));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consulter un utilisateur',
    description: 'Retourne le détail de l’utilisateur demandé.',
  })
  obtenir(@Param('id', ParseIntPipe) id: number) {
    return this.utilisateurs.obtenir(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Créer un utilisateur',
    description: 'Crée un utilisateur avec ses informations et son rôle.',
  })
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(VALIDATION_PAYLOAD)
  async creer(@Body() donnees: CreerUtilisateurDto) {
    return {
      message: "L'utilisateur a été créé avec succès.",
      utilisateur: await this.utilisateurs.creer(donnees),
    };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Modifier un utilisateur',
    description: 'Met à jour les informations fournies pour un utilisateur.',
  })
  @UsePipes(VALIDATION_PAYLOAD)
  async modifier(
    @Param('id', ParseIntPipe) id: number,
    @Body() donnees: ModifierUtilisateurDto,
  ) {
    return {
      message: "L'utilisateur a été modifié avec succès.",
      utilisateur: await this.utilisateurs.modifier(id, donnees),
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer un utilisateur',
    description:
      'Supprime définitivement un utilisateur qui n’est plus utilisé.',
  })
  @HttpCode(HttpStatus.OK)
  async supprimer(@Param('id', ParseIntPipe) id: number) {
    await this.utilisateurs.supprimer(id);
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
