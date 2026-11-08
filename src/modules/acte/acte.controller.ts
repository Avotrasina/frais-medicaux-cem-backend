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
import { CreateActeDto, UpdateActeDto } from './dtos/acte.dto.js';
import { ActeQueryDto } from './dtos/acte-query.dto.js';
import { DeleteActeUseCase } from './use-cases/acte.delete.js';
import { ReadActeUseCase } from './use-cases/acte.read.js';
import { CreateActeUseCase } from './use-cases/acte.create.js';
import { UpdateActeUseCase } from './use-cases/acte.update.js';
import {
  ActeAvecPlafondsResponseDto,
  ActeResponseDto,
} from './dtos/acte-response.dto.js';

@Controller('actes')
@ApiExtraModels(ActeResponseDto, ActeAvecPlafondsResponseDto)
export class ActeController {
  constructor(
    private readonly createActeUseCase: CreateActeUseCase,
    private readonly readActeUseCase: ReadActeUseCase,
    private readonly updateActeUseCase: UpdateActeUseCase,
    private readonly deleteActeUseCase: DeleteActeUseCase,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: ActeResponseDto })
  async create(@Body() body: CreateActeDto): Promise<ActeResponseDto> {
    return this.createActeUseCase.execute(body);
  }

  @Get()
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: {
        oneOf: [
          { $ref: getSchemaPath(ActeResponseDto) },
          { $ref: getSchemaPath(ActeAvecPlafondsResponseDto) },
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
  async findAll(
    @Query() query: ActeQueryDto,
  ): Promise<(ActeResponseDto | ActeAvecPlafondsResponseDto)[]> {
    return this.readActeUseCase.findAll(query);
  }

  @Get(':id')
  @ApiOkResponse({ type: ActeResponseDto })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ActeResponseDto> {
    return this.readActeUseCase.findById(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: ActeResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateActeDto,
  ): Promise<ActeResponseDto> {
    return this.updateActeUseCase.execute(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deleteActeUseCase.execute(id);
  }
}
