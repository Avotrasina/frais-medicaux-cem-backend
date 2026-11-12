import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import {
  createImageFilePipe,
  createOptionalImageFilePipe,
} from '../../common/pipes/image-file.pipe.js';
import { RoleUtilisateur } from '../../generated/prisma/enums.js';
import { CreerUtilisateurDto } from './dtos/utilisateur.dto.js';
import { UtilisateurService } from './utilisateur.service.js';

vi.hoisted(() => {
  process.env.NODE_ENV = 'development';
});

describe('UtilisateurService', () => {
  it('normalise et valide les identifiants de création', async () => {
    const dto = plainToInstance(CreerUtilisateurDto, {
      nom: ' Opérateur ',
      role: RoleUtilisateur.OPERATEUR,
      username: ' user01 ',
      email: ' USER01@EXAMPLE.COM ',
      mdp: 'secret-123',
    });

    expect(await validate(dto)).toEqual([]);
    expect(dto.username).toBe('user01');
    expect(dto.email).toBe('user01@example.com');
  });

  it('refuse une adresse e-mail invalide', async () => {
    const dto = plainToInstance(CreerUtilisateurDto, {
      nom: 'Opérateur',
      role: RoleUtilisateur.OPERATEUR,
      username: 'user01',
      email: 'invalid',
      mdp: 'secret-123',
    });

    expect(await validate(dto)).not.toEqual([]);
  });

  it('stocke un hash du mot de passe sans le retourner', async () => {
    const create = vi.fn(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: 1,
        nom: data.nom,
        role: data.role,
        username: data.username,
        email: data.email,
        profil: data.profil ?? null,
      }),
    );
    const prisma = {
      utilisateur: { create },
    } as unknown as PrismaService;
    const service = new UtilisateurService(prisma);

    const utilisateur = await service.creer({
      nom: 'Opérateur',
      role: RoleUtilisateur.OPERATEUR,
      username: 'user01',
      email: 'user01@example.com',
      mdp: 'secret-123',
    });

    const motDePasseStocke = create.mock.calls[0][0].data.mdp;
    expect(motDePasseStocke).toMatch(/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/);
    expect(motDePasseStocke).not.toBe('secret-123');
    expect(utilisateur).not.toHaveProperty('mdp');
  });

  it('valide le type image du profil et permet son omission', async () => {
    const fichierInvalide = {
      fieldname: 'profil',
      originalname: 'profil.txt',
      encoding: '7bit',
      mimetype: 'text/plain',
      size: 4,
    };

    await expect(
      createOptionalImageFilePipe().transform(fichierInvalide),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      createOptionalImageFilePipe().transform(undefined),
    ).resolves.toBeUndefined();
    await expect(
      createImageFilePipe().transform(undefined),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
