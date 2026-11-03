import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { RoleUtilisateur } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';

interface RequeteAvecUtilisateur extends Request {
  user?: { id: number; role: RoleUtilisateur };
}

@Injectable()
export class FactureRoleGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(contexte: ExecutionContext): Promise<boolean> {
    const requete = contexte
      .switchToHttp()
      .getRequest<RequeteAvecUtilisateur>();
    const utilisateurId = this.obtenirUtilisateurId(requete);
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: { id: true, role: true },
    });

    if (utilisateur === null) {
      throw new UnauthorizedException(
        "L'utilisateur authentifié est introuvable.",
      );
    }
    requete.user = utilisateur;
    return true;
  }

  private obtenirUtilisateurId(requete: RequeteAvecUtilisateur): number {
    const identifiantAuthentifie = requete.user?.id;
    if (
      identifiantAuthentifie !== undefined &&
      Number.isSafeInteger(identifiantAuthentifie) &&
      identifiantAuthentifie > 0
    ) {
      return identifiantAuthentifie;
    }

    const identifiantTest = process.env.FACTURATION_UTILISATEUR_TEST_ID;
    if (
      process.env.NODE_ENV === 'development' &&
      identifiantTest !== undefined
    ) {
      if (!/^[1-9]\d*$/.test(identifiantTest)) {
        throw new UnauthorizedException(
          'FACTURATION_UTILISATEUR_TEST_ID doit être un identifiant entier positif.',
        );
      }
      const identifiant = Number(identifiantTest);
      if (Number.isSafeInteger(identifiant)) return identifiant;
    }

    throw new UnauthorizedException(
      'Aucun utilisateur authentifié n’est disponible pour cette action.',
    );
  }
}
