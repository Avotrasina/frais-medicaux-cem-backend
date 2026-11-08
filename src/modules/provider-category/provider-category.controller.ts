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
import { ProviderTreeDeletionUseCase } from '../provider/use-cases/provider-tree.delete.js';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { ProviderCategoryResponseDto } from './dtos/provider-category-response.dto.js';

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
  @ApiCreatedResponse({ type: ProviderCategoryResponseDto })
  async create(
    @Body() body: CreateProviderCategoryDto,
  ): Promise<ProviderCategoryResponseDto> {
    return this.saveProviderCategoryUseCase.execute(body);
  }

  @Get()
  @ApiOkResponse({ type: ProviderCategoryResponseDto, isArray: true })
  async findAll(): Promise<ProviderCategoryResponseDto[]> {
    return this.readProviderCategoryUseCase.findAll();
  }

  @Get('deletion-requests')
  @ApiOkResponse({ type: ProviderCategoryResponseDto, isArray: true })
  async findDeletionRequests(): Promise<ProviderCategoryResponseDto[]> {
    return this.readProviderCategoryUseCase.findDeletionRequests();
  }

  @Patch(':id')
  @ApiOkResponse({ type: ProviderCategoryResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateProviderCategoryDto,
  ): Promise<ProviderCategoryResponseDto> {
    return this.updateProviderCategoryUseCase.updatePartial(id, body);
  }
}
