import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SaveLieuUseCase } from './use-cases/location.save.js';
import { UpdateLieuUseCase } from './use-cases/location.update.js';
import { ReadLieuUseCase } from './use-cases/location.read.js';
import { CreateLieuDto, UpdateLieuDto } from './dtos/location.dto.js';
import { ProviderTreeDeletionUseCase } from '../provider/use-cases/provider-tree.delete.js';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { LocationResponseDto } from './dtos/location-response.dto.js';

@Controller('locations')
export class LieuController {
  constructor(
    private readonly saveLieuUseCase: SaveLieuUseCase,
    private readonly updateLieuUseCase: UpdateLieuUseCase,
    private readonly readLieuUseCase: ReadLieuUseCase,
    private readonly deletionUseCase: ProviderTreeDeletionUseCase,
  ) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestDeletion(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deletionUseCase.request('lieu', id);
  }

  @Post(':id/deletion-validation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async validateDeletion(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deletionUseCase.validate('lieu', id);
  }

  @Post(':id/deletion-rejection')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectDeletion(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deletionUseCase.reject('lieu', id);
  }

  @Post()
  @ApiCreatedResponse({ type: LocationResponseDto })
  async create(@Body() body: CreateLieuDto): Promise<LocationResponseDto> {
    return this.saveLieuUseCase.execute(body);
  }

  @Get()
  @ApiOkResponse({ type: LocationResponseDto, isArray: true })
  async findAll(): Promise<LocationResponseDto[]> {
    return this.readLieuUseCase.findAll();
  }

  @Get('deletion-requests')
  @ApiOkResponse({ type: LocationResponseDto, isArray: true })
  async findDeletionRequests(): Promise<LocationResponseDto[]> {
    return this.readLieuUseCase.findDeletionRequests();
  }

  @Patch(':id')
  @ApiOkResponse({ type: LocationResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateLieuDto,
  ): Promise<LocationResponseDto> {
    return this.updateLieuUseCase.updatePartial(id, body);
  }
}
