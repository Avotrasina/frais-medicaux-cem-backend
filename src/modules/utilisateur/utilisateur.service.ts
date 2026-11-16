import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, scrypt } from 'node:crypto';
import { Prisma } from '../../generated/prisma/client.js';
import { RoleUtilisateur } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import {
  CreerUtilisateurDto,
  ModifierUtilisateurDto,
} from './dtos/utilisateur.dto.js';

const UTILISATEUR_SELECT = {
  id: true,
  nom: true,
  role: true,
  username: true,
  email: true,
  profil: true,
} as const;

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

  async creer(donnees: CreerUtilisateurDto & { profil?: string }) {
    try {
      return await this.prisma.utilisateur.create({
        data: {
          nom: donnees.nom,
          role: donnees.role,
          username: donnees.username,
          email: donnees.email,
          mdp: await hashPassword(donnees.mdp),
          profil: donnees.profil,
        },
        select: UTILISATEUR_SELECT,
      });
    } catch (erreur: unknown) {
      if (this.estErreurPrisma(erreur, 'P2002')) {
        throw new ConflictException(
          'Cette adresse e-mail est déjà associée à un utilisateur.',
        );
      }
      throw erreur;
    }
  }

  async modifier(
    id: number,
    donnees: ModifierUtilisateurDto & { profil?: string },
  ) {
    if (
      donnees.nom === undefined &&
      donnees.role === undefined &&
      donnees.username === undefined &&
      donnees.email === undefined &&
      donnees.mdp === undefined &&
      donnees.profil === undefined
    ) {
      throw new BadRequestException(
        'Au moins un champ doit être fourni pour modifier l’utilisateur.',
      );
    }
    try {
      return await this.prisma.utilisateur.update({
        where: { id },
        data: {
          nom: donnees.nom,
          role: donnees.role,
          username: donnees.username,
          email: donnees.email,
          profil: donnees.profil,
          ...(donnees.mdp === undefined
            ? {}
            : { mdp: await hashPassword(donnees.mdp) }),
        },
        select: UTILISATEUR_SELECT,
      });
    } catch (erreur: unknown) {
      if (this.estErreurPrisma(erreur, 'P2025')) {
        throw new NotFoundException(`L'utilisateur ${id} est introuvable.`);
      }
      if (this.estErreurPrisma(erreur, 'P2002')) {
        throw new ConflictException(
          'Cette adresse e-mail est déjà associée à un utilisateur.',
        );
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

function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (erreur, derive) => {
      if (erreur !== null) {
        reject(erreur);
        return;
      }
      resolve(`scrypt$${salt}$${derive.toString('hex')}`);
    });
  });
}
