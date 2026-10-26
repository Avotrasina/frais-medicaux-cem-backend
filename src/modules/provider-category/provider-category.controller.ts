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
import { SaveProviderCategoryUseCase } from './use-cases/provider-category.save.js';
import { UpdateProviderCategoryUseCase } from './use-cases/provider-category.update.js';
import { ReadProviderCategoryUseCase } from './use-cases/provider-category.read.js';
import {
  CreateProviderCategoryDto,
  UpdateProviderCategoryDto,
} from './dtos/provider-category.dto.js';
import type { ReadProviderCategory } from './types/provider-category.types.js';
import { ProviderTreeDeletionUseCase } from '../provider/use-cases/provider-tree.delete.js';

@Controller('provider-categories')
export class ProviderCategoryController {
  constructor(
    private readonly saveProviderCategoryUseCase: SaveProviderCategoryUseCase,
    private readonly updateProviderCategoryUseCase: UpdateProviderCategoryUseCase,
    private readonly readProviderCategoryUseCase: ReadProviderCategoryUseCase,
    private readonly deletionUseCase: ProviderTreeDeletionUseCase,
  ) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestDeletion(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deletionUseCase.request('categoriePrestataire', id);
  }

  @Post(':id/deletion-validation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async validateDeletion(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deletionUseCase.validate('categoriePrestataire', id);
  }

  @Post(':id/deletion-rejection')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectDeletion(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deletionUseCase.reject('categoriePrestataire', id);
  }

  @Post()
  async create(
    @Body() body: CreateProviderCategoryDto,
  ): Promise<ReadProviderCategory> {
    return this.saveProviderCategoryUseCase.execute(body);
  }

  @Get()
  async findAll(): Promise<ReadProviderCategory[]> {
    return this.readProviderCategoryUseCase.findAll();
  }

  @Get('deletion-requests')
  async findDeletionRequests(): Promise<ReadProviderCategory[]> {
    return this.readProviderCategoryUseCase.findDeletionRequests();
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateProviderCategoryDto,
  ): Promise<ReadProviderCategory> {
    return this.updateProviderCategoryUseCase.updatePartial(id, body);
  }
}
