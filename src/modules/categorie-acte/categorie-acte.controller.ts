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
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiQuery,
  getSchemaPath,
} from '@nestjs/swagger';
import { CategorieActeQueryDto } from './dtos/categorie-acte-query.dto.js';
import {
  CreateCategorieActeDto,
  UpdateCategorieActeDto,
} from './dtos/categorie-acte.dto.js';
import { DeleteCategorieActeUseCase } from './use-cases/categorie-acte.delete.js';
import { ReadCategorieActeUseCase } from './use-cases/categorie-acte.read.js';
import { CreateCategorieActeUseCase } from './use-cases/categorie-acte.create.js';
import { UpdateCategorieActeUseCase } from './use-cases/categorie-acte.update.js';
import {
  CategorieActeAvecActesResponseDto,
  CategorieActeAvecPlafondsEtActesResponseDto,
  CategorieActeAvecPlafondsResponseDto,
  CategorieActeResponseDto,
} from './dtos/categorie-acte-response.dto.js';

@Controller('categories-actes')
@ApiExtraModels(
  CategorieActeResponseDto,
  CategorieActeAvecPlafondsResponseDto,
  CategorieActeAvecActesResponseDto,
  CategorieActeAvecPlafondsEtActesResponseDto,
)
export class CategorieActeController {
  constructor(
    private readonly createCategorieActeUseCase: CreateCategorieActeUseCase,
    private readonly readCategorieActeUseCase: ReadCategorieActeUseCase,
    private readonly updateCategorieActeUseCase: UpdateCategorieActeUseCase,
    private readonly deleteCategorieActeUseCase: DeleteCategorieActeUseCase,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: CategorieActeResponseDto })
  async create(
    @Body() body: CreateCategorieActeDto,
  ): Promise<CategorieActeResponseDto> {
    return this.createCategorieActeUseCase.execute(body);
  }

  @Get()
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: {
        oneOf: [
          { $ref: getSchemaPath(CategorieActeResponseDto) },
          { $ref: getSchemaPath(CategorieActeAvecPlafondsResponseDto) },
          { $ref: getSchemaPath(CategorieActeAvecActesResponseDto) },
          {
            $ref: getSchemaPath(CategorieActeAvecPlafondsEtActesResponseDto),
          },
        ],
      },
    },
  })
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
  async findAll(
    @Query() query: CategorieActeQueryDto,
  ): Promise<
    (
      | CategorieActeResponseDto
      | CategorieActeAvecPlafondsResponseDto
      | CategorieActeAvecActesResponseDto
      | CategorieActeAvecPlafondsEtActesResponseDto
    )[]
  > {
    return this.readCategorieActeUseCase.findAll(query);
  }

  @Get(':id')
  @ApiOkResponse({ type: CategorieActeResponseDto })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CategorieActeResponseDto> {
    return this.readCategorieActeUseCase.findById(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: CategorieActeResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCategorieActeDto,
  ): Promise<CategorieActeResponseDto> {
    return this.updateCategorieActeUseCase.execute(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deleteCategorieActeUseCase.execute(id);
  }
}
