import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { RoleUtilisateur } from '../../src/generated/prisma/enums.js';
import { UtilisateurController } from '../../src/modules/utilisateur/utilisateur.controller.js';

vi.mock('../../src/modules/utilisateur/utilisateur.service.js', () => ({
  UtilisateurService: class UtilisateurService {},
}));

describe('UtilisateurController', () => {
  it('filtre les utilisateurs par rôles', async () => {
    const lister = vi.fn().mockResolvedValue([]);
    const controller = new UtilisateurController({ lister } as never);

    await controller.lister('ADJOINT,CHEF');

    expect(lister).toHaveBeenCalledWith([
      RoleUtilisateur.ADJOINT,
      RoleUtilisateur.CHEF,
    ]);
  });

  it('refuse un rôle inconnu', () => {
    const controller = new UtilisateurController({ lister: vi.fn() } as never);

    expect(() => controller.lister('ADJOINT,INCONNU')).toThrow(
      BadRequestException,
    );
  });
});
