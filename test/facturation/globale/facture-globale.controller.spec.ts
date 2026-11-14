import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.NODE_ENV = 'development';
});

import { ActeController } from '../../../src/modules/acte/acte.controller.js';
import { CreateActeUseCase } from '../../../src/modules/acte/use-cases/acte.create.js';
import { CreateActeWithCeilingsUseCase } from '../../../src/modules/acte/use-cases/acte-create-with-ceilings.use-case.js';
import { DeleteActeUseCase } from '../../../src/modules/acte/use-cases/acte.delete.js';
import { ReadActeUseCase } from '../../../src/modules/acte/use-cases/acte.read.js';
import { UpdateActeUseCase } from '../../../src/modules/acte/use-cases/acte.update.js';
import { CategorieActeController } from '../../../src/modules/categorie-acte/categorie-acte.controller.js';
import { CreateCategorieActeUseCase } from '../../../src/modules/categorie-acte/use-cases/categorie-acte.create.js';
import { DeleteCategorieActeUseCase } from '../../../src/modules/categorie-acte/use-cases/categorie-acte.delete.js';
import { ReadCategorieActeUseCase } from '../../../src/modules/categorie-acte/use-cases/categorie-acte.read.js';
import { UpdateCategorieActeUseCase } from '../../../src/modules/categorie-acte/use-cases/categorie-acte.update.js';
import { StatutFacture } from '../../../src/generated/prisma/enums.js';
import type {
  LignePaieResponseDto,
  LignesPaiePagineesResponseDto,
} from '../../../src/modules/facturation/dtos/paie-response.dto.js';
import { FactureGlobaleController } from '../../../src/modules/facturation/factures/globale/facture-globale.controller.js';
import { CloturePaieController } from '../../../src/modules/facturation/factures/paie/cloture-paie.controller.js';
import { CloturePaieService } from '../../../src/modules/facturation/factures/paie/cloture-paie.service.js';
import { PaieEtatController } from '../../../src/modules/facturation/factures/paie/paie-etat.controller.js';
import { PaieEtatService } from '../../../src/modules/facturation/factures/paie/paie-etat.service.js';

describe('Facturation API response contract', () => {
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

    expect(service.lister).toHaveBeenCalledWith(
      StatutFacture.ENREGISTREE,
      undefined,
      undefined,
    );
  });

  it('returns paginated payment rows in the documented JSON shape', async () => {
    const ligne = {
      numLigne: 1,
      moisAffectation: '2026-03-01',
      refPaie: 'PAIE-2026-03',
      dateSaisie: '2026-03-25',
      refSociale: 'FAC-2026-001',
      numFacture: '001',
      dateFacture: '2026-03-10',
      nomEtablissement: 'Clinique CEM',
      idp: 'IDP-001',
      nomPrenomBeneficiaire: 'Jean Doe',
      codeFam: 'AGT',
      obsIdp: null,
      im: 101,
      nomPrenomAgent: 'Jean Doe',
      direction: 'DRH',
      serviceAgence: 'RH',
      codeActe: 'ACT-01',
      acte: 'Consultation',
      categorie: 'Soins',
      dateActe: '2026-03-12',
      numPec: null,
      obsDepassement: null,
      montantActe: '100.00',
      cem100: '0.00',
      depassement: '0.00',
      cem80: '80.00',
      agent20: '20.00',
      totalAgent: '20.00',
    } satisfies LignePaieResponseDto;
    const response = {
      total: 1,
      page: 1,
      limite: 50,
      lignes: [ligne],
    } satisfies LignesPaiePagineesResponseDto;
    const service = { listerLignes: vi.fn().mockResolvedValue(response) };
    const controller = new PaieEtatController(service as never);

    await expect(
      controller.listerLignes('2026-03'),
    ).resolves.toEqual(response);
    expect(service.listerLignes).toHaveBeenCalledWith(
      '2026-03',
      {
        im: undefined,
        prestataireId: undefined,
        factureId: undefined,
        direction: undefined,
      },
      1,
      50,
    );
  });

  it('publishes detailed OpenAPI schemas for payment and ceiling responses', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [
        PaieEtatController,
        CloturePaieController,
        ActeController,
        CategorieActeController,
      ],
      providers: [
        { provide: PaieEtatService, useValue: {} },
        { provide: CloturePaieService, useValue: {} },
        { provide: CreateActeUseCase, useValue: {} },
        { provide: CreateActeWithCeilingsUseCase, useValue: {} },
        { provide: DeleteActeUseCase, useValue: {} },
        { provide: ReadActeUseCase, useValue: {} },
        { provide: UpdateActeUseCase, useValue: {} },
        { provide: CreateCategorieActeUseCase, useValue: {} },
        { provide: DeleteCategorieActeUseCase, useValue: {} },
        { provide: ReadCategorieActeUseCase, useValue: {} },
        { provide: UpdateCategorieActeUseCase, useValue: {} },
      ],
    }).compile();
    const app = moduleRef.createNestApplication();
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Contract test').setVersion('1').build(),
    );

    expect(document.paths['/paies']?.get?.responses['200']).toHaveProperty(
      'content.application/json.schema.items.$ref',
      '#/components/schemas/PaieMoisResponseDto',
    );
    expect(
      document.paths['/paies/{mois}/lignes']?.get?.responses['200'],
    ).toHaveProperty(
      'content.application/json.schema.$ref',
      '#/components/schemas/LignesPaiePagineesResponseDto',
    );
    expect(
      document.paths['/paies/{mois}/consommation']?.get?.responses['200'],
    ).toHaveProperty(
      'content.application/json.schema.$ref',
      '#/components/schemas/ConsommationPaieResponseDto',
    );
    expect(
      document.paths['/paies/{mois}/etat']?.get?.responses['200'],
    ).toHaveProperty(
      'content.application/json.schema.$ref',
      '#/components/schemas/EtatPaieResponseDto',
    );
    expect(
      document.paths['/paies/{mois}/agents/{im}']?.get?.responses['200'],
    ).toHaveProperty(
      'content.application/json.schema.$ref',
      '#/components/schemas/EtatIndividuelPaieResponseDto',
    );
    expect(
      document.components?.schemas?.LignePaieResponseDto,
    ).toMatchObject({
      properties: {
        codeFam: { nullable: true, enum: ['AGT', 'CJT', 'EFT'] },
        totalAgent: { type: 'string' },
        dateActe: { type: 'string', format: 'date' },
      },
    });
    expect(document.paths['/actes']?.post?.responses['201']).toHaveProperty(
      'content.application/json.schema.anyOf',
      [
        { $ref: '#/components/schemas/ActeResponseDto' },
        { $ref: '#/components/schemas/ActeAvecPlafondsResponseDto' },
      ],
    );
    expect(
      document.paths['/categories-actes']?.post?.responses['201'],
    ).toHaveProperty('content.application/json.schema.anyOf');
    expect(document.paths['/actes/{id}']?.delete?.responses['204']).not
      .toHaveProperty('content');
    expect(
      document.paths['/paies/{mois}/cloture']?.post?.responses['201'],
    ).toHaveProperty(
      'content.application/json.schema.$ref',
      '#/components/schemas/CloturePaieResponseDto',
    );

    await app.close();
  }, 20000);
});
