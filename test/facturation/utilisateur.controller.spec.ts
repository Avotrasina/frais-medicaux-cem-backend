import { BadRequestException } from '@nestjs/common';
import { RoleUtilisateur } from '../../src/generated/prisma/enums.js';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service.js';
import { UtilisateurController } from '../../src/modules/facturation/utilisateur.controller.js';

vi.mock('../../src/infrastructure/prisma/prisma.service.js', () => ({
  PrismaService: class PrismaService {},
}));

describe('UtilisateurController', () => {
  it('retourne uniquement les utilisateurs aux rôles demandés', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const controller = new UtilisateurController({
      utilisateur: { findMany },
    } as unknown as PrismaService);

    await controller.lister('ADJOINT,CHEF');

    expect(findMany).toHaveBeenCalledWith({
      where: {
        role: {
          in: [RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF],
        },
      },
      select: { id: true, nom: true, role: true },
      orderBy: [{ role: 'asc' }, { nom: 'asc' }, { id: 'asc' }],
    });
  });

  it('refuse un rôle inconnu', () => {
    const controller = new UtilisateurController({
      utilisateur: { findMany: vi.fn() },
    } as unknown as PrismaService);

    expect(() => controller.lister('ADJOINT,INCONNU')).toThrow(
      BadRequestException,
    );
  });
});
