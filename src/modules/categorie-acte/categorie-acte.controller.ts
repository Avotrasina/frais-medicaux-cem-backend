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
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiQuery,
  getSchemaPath,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateActeWithCeilingsUseCase } from '../acte/use-cases/acte-create-with-ceilings.use-case.js';
import {
  CreateCategorieWithCeilingsDto,
  PlafondParActeDto,
  PlafondParAnMontantDto,
  PlafondParAnSeancesDto,
  PlafondsCreationDto,
} from '../acte/dtos/acte-creation.dto.js';
import { CategorieActeQueryDto } from './dtos/categorie-acte-query.dto.js';
import { UpdateCategorieActeDto } from './dtos/categorie-acte.dto.js';
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

const CREATE_CATEGORIE_PIPE = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});
const UPDATE_CATEGORIE_PIPE = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@Controller('categories-actes')
@ApiExtraModels(
  CategorieActeResponseDto,
  CategorieActeAvecPlafondsResponseDto,
  CategorieActeAvecActesResponseDto,
  CategorieActeAvecPlafondsEtActesResponseDto,
  CreateCategorieWithCeilingsDto,
  PlafondsCreationDto,
  PlafondParActeDto,
  PlafondParAnMontantDto,
  PlafondParAnSeancesDto,
)
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
  @ApiCreatedResponse({
    schema: {
      anyOf: [
        { $ref: getSchemaPath(CategorieActeResponseDto) },
        { $ref: getSchemaPath(CategorieActeAvecPlafondsResponseDto) },
      ],
    },
  })
  async create(
    @Body() body: CreateCategorieWithCeilingsDto,
  ): Promise<CategorieActeResponseDto | CategorieActeAvecPlafondsResponseDto> {
    if (body.plafonds !== undefined || body.dateEffet !== undefined) {
      return this.createActeWithCeilingsUseCase.executeCategorie(body);
    }
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
  @ApiBody({
    type: UpdateCategorieActeDto,
    examples: {
      plafondAnnuel: {
        summary: 'Modifier le plafond annuel partagé de cette catégorie',
        value: {
          porteePlafond: 'PAR_AN',
          unite: 'MONTANT',
          montant: 750000,
          categorieActeID: 4,
        },
      },
      contrainteComplete: {
        summary:
          'Poser la contrainte de la catégorie (efface les contraintes propres de ses actes)',
        value: {
          nomCategorie: 'Soins dentaires',
          plafonds: {
            parActe: { montant: 100000 },
            parAn: { unite: 'MONTANT', montant: 500000 },
          },
        },
      },
      suppressionContrainte: {
        summary: 'Retirer la contrainte de la catégorie',
        value: { plafonds: null },
      },
    },
  })
  @UsePipes(UPDATE_CATEGORIE_PIPE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCategorieActeDto,
  ): Promise<CategorieActeResponseDto> {
    return this.updateCategorieActeUseCase.execute(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Catégorie d’acte supprimée.' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deleteCategorieActeUseCase.execute(id);
  }
}
