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
import { ApiQuery } from '@nestjs/swagger';
import { CreatePlafondDto, UpdatePlafondDto } from './dtos/plafond.dto.js';
import { PlafondQueryDto } from './dtos/plafond-query.dto.js';
import { DeletePlafondUseCase } from './use-cases/plafond.delete.js';
import { ReadPlafondUseCase } from './use-cases/plafond.read.js';
import { CreatePlafondUseCase } from './use-cases/plafond.create.js';
import { UpdatePlafondUseCase } from './use-cases/plafond.update.js';
import type { ReadPlafond } from './types/plafond.types.js';

@Controller('plafonds')
export class PlafondController {
  constructor(
    private readonly createPlafondUseCase: CreatePlafondUseCase,
    private readonly readPlafondUseCase: ReadPlafondUseCase,
    private readonly updatePlafondUseCase: UpdatePlafondUseCase,
    private readonly deletePlafondUseCase: DeletePlafondUseCase,
  ) {}

  @Post()
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async create(@Body() body: CreatePlafondDto): Promise<ReadPlafond> {
    return this.createPlafondUseCase.execute(body);
  }

  @Get()
  @ApiQuery({
    name: 'acteId',
    required: false,
    type: Number,
    description: 'Filtre les versions liées directement à cet acte.',
  })
  @ApiQuery({
    name: 'categorieActeId',
    required: false,
    type: Number,
    description: 'Filtre les versions liées directement à cette catégorie.',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    example: '2026-01-15',
    description: 'Ne renvoie que les versions en vigueur à cette date.',
  })
  async findAll(@Query() query: PlafondQueryDto): Promise<ReadPlafond[]> {
    return this.readPlafondUseCase.findAll(query);
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number): Promise<ReadPlafond> {
    return this.readPlafondUseCase.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePlafondDto,
  ): Promise<ReadPlafond> {
    return this.updatePlafondUseCase.execute(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deletePlafondUseCase.execute(id);
  }
}
