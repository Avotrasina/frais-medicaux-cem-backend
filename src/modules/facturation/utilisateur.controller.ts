import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { RoleUtilisateur } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';

const ROLES_VALIDES = Object.values(RoleUtilisateur);

@Controller('utilisateurs')
export class UtilisateurController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  lister(@Query('role') role = 'ADJOINT,CHEF') {
    const valeurs = role.split(',').map((valeur) => valeur.trim());
    const roles = valeurs.filter(
      (valeur): valeur is RoleUtilisateur =>
        ROLES_VALIDES.some((roleValide) => roleValide === valeur),
    );
    if (
      roles.length === 0 ||
      roles.length !== valeurs.length ||
      valeurs.some((valeur) => valeur.length === 0)
    ) {
      throw new BadRequestException('Le filtre role contient un rôle invalide.');
    }

    return this.prisma.utilisateur.findMany({
      where: { role: { in: roles } },
      select: { id: true, nom: true, role: true },
      orderBy: [{ role: 'asc' }, { nom: 'asc' }, { id: 'asc' }],
    });
  }
}
