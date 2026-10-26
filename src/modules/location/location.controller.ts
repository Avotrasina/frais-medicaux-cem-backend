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
import type { ReadLieu } from './types/location.types.js';
import { ProviderTreeDeletionUseCase } from '../provider/provider-tree.delete.js';

@Controller('lieux')
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

  @Post(':id/deletion/validate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async validateDeletion(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deletionUseCase.validate('lieu', id);
  }

  @Post(':id/deletion/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectDeletion(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deletionUseCase.reject('lieu', id);
  }

  @Post()
  async create(@Body() body: CreateLieuDto): Promise<ReadLieu> {
    return this.saveLieuUseCase.execute(body);
  }

  @Get()
  async findAll(): Promise<ReadLieu[]> {
    return this.readLieuUseCase.readAll();
  }

  @Get('deletion/requests')
  async findDeletionRequests(): Promise<ReadLieu[]> {
    return this.readLieuUseCase.readDeletionRequests();
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateLieuDto,
  ): Promise<ReadLieu> {
    return this.updateLieuUseCase.updatePartial(id, body);
  }
}
