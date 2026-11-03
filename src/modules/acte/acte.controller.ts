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
import { ApiQuery } from '@nestjs/swagger';
import { CreateActeDto, UpdateActeDto } from './dtos/acte.dto.js';
import { ActeQueryDto } from './dtos/acte-query.dto.js';
import { DeleteActeUseCase } from './use-cases/acte.delete.js';
import { ReadActeUseCase } from './use-cases/acte.read.js';
import { CreateActeUseCase } from './use-cases/acte.create.js';
import { UpdateActeUseCase } from './use-cases/acte.update.js';
import type { ReadActe } from './types/acte.types.js';

@Controller('actes')
export class ActeController {
  constructor(
    private readonly createActeUseCase: CreateActeUseCase,
    private readonly readActeUseCase: ReadActeUseCase,
    private readonly updateActeUseCase: UpdateActeUseCase,
    private readonly deleteActeUseCase: DeleteActeUseCase,
  ) {}

  @Post()
  async create(@Body() body: CreateActeDto): Promise<ReadActe> {
    return this.createActeUseCase.execute(body);
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
