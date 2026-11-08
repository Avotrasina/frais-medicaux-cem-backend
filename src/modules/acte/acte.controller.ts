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
import { ApiBody, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreateActeDto, UpdateActeDto } from './dtos/acte.dto.js';
import { CreateActeRequestDto } from './dtos/acte-creation.dto.js';
import { ActeQueryDto } from './dtos/acte-query.dto.js';
import { DeleteActeUseCase } from './use-cases/acte.delete.js';
import { ReadActeUseCase } from './use-cases/acte.read.js';
import { CreateActeUseCase } from './use-cases/acte.create.js';
import { CreateActeWithCeilingsUseCase } from './use-cases/acte-create-with-ceilings.use-case.js';
import { UpdateActeUseCase } from './use-cases/acte.update.js';
import type { ReadActe } from './types/acte.types.js';

const CREATE_ACTE_PIPE = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@Controller('actes')
export class ActeController {
  constructor(
    private readonly createActeUseCase: CreateActeUseCase,
    private readonly createActeWithCeilingsUseCase: CreateActeWithCeilingsUseCase,
    private readonly readActeUseCase: ReadActeUseCase,
    private readonly updateActeUseCase: UpdateActeUseCase,
    private readonly deleteActeUseCase: DeleteActeUseCase,
  ) {}

  @Post()
  @UsePipes(CREATE_ACTE_PIPE)
  @ApiBody({
    schema: {
      oneOf: [
        {
          type: 'object',
          required: [
            'type',
            'code',
            'nomActe',
            'listeLibelle',
            'categorieActeId',
          ],
          properties: {
            type: { type: 'string', enum: ['ACTE'] },
            code: { type: 'string' },
            nomActe: { type: 'string' },
            listeLibelle: { type: 'string' },
            regime: {
              type: 'string',
              enum: ['NORMAL', 'EXCLU', 'SUR_DECISION_DG'],
            },
            categorieActeId: { type: 'integer' },
            plafonds: {
              type: 'object',
              properties: {
                parActe: {
                  type: 'object',
                  required: ['montant'],
                  properties: { montant: { type: 'number', minimum: 0.01 } },
                },
                parAn: {
                  oneOf: [
                    {
                      type: 'object',
                      required: ['unite', 'montant'],
                      properties: {
                        unite: { type: 'string', enum: ['MONTANT'] },
                        montant: {
                          type: 'number',
                          minimum: 0.01,
                          multipleOf: 0.01,
                        },
                      },
                    },
                    {
                      type: 'object',
                      required: ['unite', 'nbSeances'],
                      properties: {
                        unite: { type: 'string', enum: ['SEANCES'] },
                        nbSeances: {
                          type: 'integer',
                          minimum: 1,
                        },
                      },
                    },
                  ],
                },
              },
            },
            dateEffet: { type: 'string', format: 'date' },
          },
        },
        {
          type: 'object',
          required: ['code', 'nomActe', 'listeLibelle', 'categorieActeId'],
          properties: {
            code: { type: 'string' },
            nomActe: { type: 'string' },
            listeLibelle: { type: 'string' },
            regime: {
              type: 'string',
              enum: ['NORMAL', 'EXCLU', 'SUR_DECISION_DG'],
            },
            categorieActeId: { type: 'integer' },
          },
        },
      ],
    },
    examples: {
      actePlafondsMontant: {
        summary: 'Acte avec plafonds par acte et annuel en montant',
        value: {
          type: 'ACTE',
          code: 'CON-01',
          nomActe: 'Consultation généraliste',
          listeLibelle: 'Consultation généraliste',
          categorieActeId: 1,
          plafonds: {
            parActe: { montant: 100000 },
            parAn: { unite: 'MONTANT', montant: 500000 },
          },
        },
      },
      actePlafondSeances: {
        summary: 'Acte avec plafond annuel en séances',
        value: {
          type: 'ACTE',
          code: 'KIN-01',
          nomActe: 'Séance de kinésithérapie',
          listeLibelle: 'Séance de kinésithérapie',
          categorieActeId: 1,
          plafonds: { parAn: { unite: 'SEANCES', nbSeances: 12 } },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Acte créé.' })
  @ApiResponse({
    status: 400,
    description: 'Payload invalide ou incompatible.',
  })
  @ApiResponse({ status: 404, description: 'Catégorie d’acte introuvable.' })
  @ApiResponse({
    status: 409,
    description: 'Code, nom ou plafond incompatible.',
  })
  async create(@Body() body: CreateActeRequestDto) {
    if (body.type === undefined) {
      if (
        body.dateEffet !== undefined ||
        body.plafonds?.parActe !== undefined ||
        body.plafonds?.parAn !== undefined
      ) {
        throw new BadRequestException(
          'Le champ type est requis pour créer un acte ou une catégorie avec des options.',
        );
      }
      if (
        body.code === undefined ||
        body.nomActe === undefined ||
        body.listeLibelle === undefined ||
        body.categorieActeId === undefined
      ) {
        throw new BadRequestException(
          'Les champs historiques de création d’acte sont requis.',
        );
      }
      const payload: CreateActeDto = {
        code: body.code,
        nomActe: body.nomActe,
        listeLibelle: body.listeLibelle,
        ...(body.regime === undefined ? {} : { regime: body.regime }),
        categorieActeId: body.categorieActeId,
      };
      return this.createActeUseCase.execute(payload);
    }
    if (body.type !== 'ACTE' || body.nomCategorie !== undefined) {
      throw new BadRequestException(
        'POST /actes accepte uniquement la création d’un acte ; utilisez POST /categories-actes pour une catégorie.',
      );
    }
    return this.createActeWithCeilingsUseCase.executeActe(body);
  }

  @Get()
  @ApiQuery({
    name: 'avecPlafonds',
    required: false,
    type: Boolean,
    example: false,
    description: 'Ajoute les plafonds en vigueur et le modèle de suivi.',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    example: '2026-01-15',
    description:
      'Date de référence au format AAAA-MM-JJ (défaut : aujourd’hui, fuseau Indian/Antananarivo).',
  })
  @ApiQuery({
    name: 'historique',
    required: false,
    type: Boolean,
    example: false,
    description: 'Ajoute l’historique des versions de la cible.',
  })
  async findAll(@Query() query: ActeQueryDto) {
    return this.readActeUseCase.findAll(query);
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number): Promise<ReadActe> {
    return this.readActeUseCase.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateActeDto,
  ): Promise<ReadActe> {
    return this.updateActeUseCase.execute(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deleteActeUseCase.execute(id);
  }
}
