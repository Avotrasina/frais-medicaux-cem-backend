import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { RoleUtilisateur } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import {
  CreerUtilisateurDto,
  ModifierUtilisateurDto,
} from './dtos/utilisateur.dto.js';

const UTILISATEUR_SELECT = { id: true, nom: true, role: true } as const;

@Injectable()
export class UtilisateurService {
  constructor(private readonly prisma: PrismaService) {}

  lister(roles?: RoleUtilisateur[]) {
    return this.prisma.utilisateur.findMany({
      ...(roles === undefined ? {} : { where: { role: { in: roles } } }),
      select: UTILISATEUR_SELECT,
      orderBy: [{ role: 'asc' }, { nom: 'asc' }, { id: 'asc' }],
    });
  }

  async obtenir(id: number) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id },
      select: UTILISATEUR_SELECT,
    });
    if (utilisateur === null) {
      throw new NotFoundException(`L'utilisateur ${id} est introuvable.`);
    }
    return utilisateur;
  }

  async creer(donnees: CreerUtilisateurDto) {
    return this.prisma.utilisateur.create({
      data: donnees,
      select: UTILISATEUR_SELECT,
    });
  }

  async modifier(id: number, donnees: ModifierUtilisateurDto) {
    if (donnees.nom === undefined && donnees.role === undefined) {
      throw new BadRequestException(
        'Au moins un champ doit être fourni pour modifier l’utilisateur.',
      );
    }
    try {
      return await this.prisma.utilisateur.update({
        where: { id },
        data: donnees,
        select: UTILISATEUR_SELECT,
      });
    } catch (erreur: unknown) {
      if (this.estErreurPrisma(erreur, 'P2025')) {
        throw new NotFoundException(`L'utilisateur ${id} est introuvable.`);
      }
      throw erreur;
    }
  }

  async supprimer(id: number): Promise<void> {
    try {
      await this.prisma.utilisateur.delete({ where: { id } });
    } catch (erreur: unknown) {
      if (this.estErreurPrisma(erreur, 'P2025')) {
        throw new NotFoundException(`L'utilisateur ${id} est introuvable.`);
      }
      if (this.estErreurPrisma(erreur, 'P2003')) {
        throw new ConflictException(
          'Cet utilisateur ne peut pas être supprimé car il est déjà utilisé par des factures ou des mouvements.',
        );
      }
      throw erreur;
    }
  }

  private estErreurPrisma(erreur: unknown, code: string): boolean {
    return (
      erreur instanceof Prisma.PrismaClientKnownRequestError &&
      erreur.code === code
    );
  }
}
