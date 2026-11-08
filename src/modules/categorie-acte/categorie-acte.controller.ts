import {
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
import { CreateActeWithCeilingsUseCase } from '../acte/use-cases/acte-create-with-ceilings.use-case.js';
import { CreateCategorieWithCeilingsDto } from '../acte/dtos/acte-creation.dto.js';
import { CategorieActeQueryDto } from './dtos/categorie-acte-query.dto.js';
import {
  CreateCategorieActeDto,
  UpdateCategorieActeDto,
} from './dtos/categorie-acte.dto.js';
import { DeleteCategorieActeUseCase } from './use-cases/categorie-acte.delete.js';
import { ReadCategorieActeUseCase } from './use-cases/categorie-acte.read.js';
import { CreateCategorieActeUseCase } from './use-cases/categorie-acte.create.js';
import { UpdateCategorieActeUseCase } from './use-cases/categorie-acte.update.js';
import type { ReadCategorieActe } from './types/categorie-acte.types.js';

const CREATE_CATEGORIE_PIPE = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@Controller('categories-actes')
export class CategorieActeController {
  constructor(
    private readonly createCategorieActeUseCase: CreateCategorieActeUseCase,
    private readonly createActeWithCeilingsUseCase: CreateActeWithCeilingsUseCase,
    private readonly readCategorieActeUseCase: ReadCategorieActeUseCase,
    private readonly updateCategorieActeUseCase: UpdateCategorieActeUseCase,
    private readonly deleteCategorieActeUseCase: DeleteCategorieActeUseCase,
  ) {}

  @Post()
  @UsePipes(CREATE_CATEGORIE_PIPE)
  @ApiBody({
    type: CreateCategorieWithCeilingsDto,
    examples: {
      categorieAvecPlafondAnnuel: {
        summary: 'Catégorie avec plafond annuel partagé',
        value: {
          nomCategorie: 'Soins dentaires',
          plafonds: { parAn: { unite: 'MONTANT', montant: 750000 } },
        },
      },
      categorieSansPlafond: {
        summary: 'Catégorie sans plafond',
        value: { nomCategorie: 'Nouvelle catégorie' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Catégorie créée, avec plafonds résolus si demandés.',
  })
  @ApiResponse({ status: 400, description: 'Payload invalide.' })
  @ApiResponse({ status: 409, description: 'Nom ou plafond incompatible.' })
  async create(@Body() body: CreateCategorieWithCeilingsDto) {
    if (body.plafonds !== undefined || body.dateEffet !== undefined) {
      return this.createActeWithCeilingsUseCase.executeCategorie(body);
    }
    return this.createCategorieActeUseCase.execute(body);
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
  @ApiQuery({
    name: 'inclureActes',
    required: false,
    type: Boolean,
    example: false,
    description:
      'Inclut les actes de chaque catégorie et leurs plafonds résolus.',
  })
  async findAll(@Query() query: CategorieActeQueryDto) {
    return this.readCategorieActeUseCase.findAll(query);
  }

  @Get(':id')
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ReadCategorieActe> {
    return this.readCategorieActeUseCase.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCategorieActeDto,
  ): Promise<ReadCategorieActe> {
    return this.updateCategorieActeUseCase.execute(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deleteCategorieActeUseCase.execute(id);
  }
}
