import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { StatutFacture } from '../../../src/generated/prisma/enums.js';
import { FactureGlobaleController } from '../../../src/modules/facturation/factures/globale/facture-globale.controller.js';

describe('FactureGlobaleController', () => {
  it('retourne une erreur 400 pour un statut inconnu', async () => {
    const service = { lister: vi.fn() };
    const controller = new FactureGlobaleController(service as never);

    await expect(controller.lister('qsfdqsd')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(service.lister).not.toHaveBeenCalled();
  });

  it('transmet un statut valide au service', async () => {
    const service = { lister: vi.fn().mockResolvedValue([]) };
    const controller = new FactureGlobaleController(service as never);

    await controller.lister(StatutFacture.ENREGISTREE);

    expect(service.lister).toHaveBeenCalledWith(StatutFacture.ENREGISTREE);
  });
});
