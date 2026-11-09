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
  ApiNoContentResponse,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { CreatePlafondDto, UpdatePlafondDto } from './dtos/plafond.dto.js';
import { PlafondQueryDto } from './dtos/plafond-query.dto.js';
import { DeletePlafondUseCase } from './use-cases/plafond.delete.js';
import { ReadPlafondUseCase } from './use-cases/plafond.read.js';
import { CreatePlafondUseCase } from './use-cases/plafond.create.js';
import { UpdatePlafondUseCase } from './use-cases/plafond.update.js';
import { PlafondResponseDto } from './dtos/plafond-response.dto.js';

@Controller('plafonds')
export class PlafondController {
  constructor(
    private readonly createPlafondUseCase: CreatePlafondUseCase,
    private readonly readPlafondUseCase: ReadPlafondUseCase,
    private readonly updatePlafondUseCase: UpdatePlafondUseCase,
    private readonly deletePlafondUseCase: DeletePlafondUseCase,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: PlafondResponseDto })
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async create(@Body() body: CreatePlafondDto): Promise<PlafondResponseDto> {
    return this.createPlafondUseCase.execute(body);
  }

  @Get()
  @ApiOkResponse({ type: PlafondResponseDto, isArray: true })
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
  async findAll(
    @Query() query: PlafondQueryDto,
  ): Promise<PlafondResponseDto[]> {
    return this.readPlafondUseCase.findAll(query);
  }

  @Get(':id')
  @ApiOkResponse({ type: PlafondResponseDto })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PlafondResponseDto> {
    return this.readPlafondUseCase.findById(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: PlafondResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePlafondDto,
  ): Promise<PlafondResponseDto> {
    return this.updatePlafondUseCase.execute(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Plafond supprimé.' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deletePlafondUseCase.execute(id);
  }
}
