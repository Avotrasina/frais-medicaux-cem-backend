import {
  Body,
  Controller,
  Get,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { SaveAgentCategoryUseCase } from './use-cases/agent-category.save.js';
import { UpdateAgentCategoryUseCase } from './use-cases/agent-category.update.js';
import { ReadAgentCategoryUseCase } from './use-cases/agent-category.read.js';
import {
  CreateAgentCategoryDto,
  UpdateAgentCategoryDto,
} from './dtos/agent-category.dto.js';
import type { ReadAgentCategory } from './types/agent-category.types.js';
import { DeleteAgentCategoryUseCase } from './use-cases/agent-category.delete.js';

@Controller('agent-categories')
export class AgentCategoryController {
  constructor(
    private readonly saveAgentCategoryUseCase: SaveAgentCategoryUseCase,
    private readonly updateAgentCategoryUseCase: UpdateAgentCategoryUseCase,
    private readonly readAgentCategoryUseCase: ReadAgentCategoryUseCase,
    private readonly deleteAgentCategoryUseCase: DeleteAgentCategoryUseCase,
  ) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestDeletion(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deleteAgentCategoryUseCase.request(id);
  }

  @Post(':id/deletion/validate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async validateDeletion(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deleteAgentCategoryUseCase.validate(id);
  }

  @Post(':id/deletion/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectDeletion(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deleteAgentCategoryUseCase.reject(id);
  }

  @Post()
  async create(
    @Body() body: CreateAgentCategoryDto,
  ): Promise<ReadAgentCategory> {
    return this.saveAgentCategoryUseCase.execute(body);
  }

  @Get()
  async findAll(): Promise<ReadAgentCategory[]> {
    return this.readAgentCategoryUseCase.findAll();
  }

  @Get('deletion/requests')
  async findDeletionRequests(): Promise<ReadAgentCategory[]> {
    return this.readAgentCategoryUseCase.findDeletionRequests();
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ReadAgentCategory> {
    return this.readAgentCategoryUseCase.findByID(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAgentCategoryDto,
  ): Promise<ReadAgentCategory> {
    return this.updateAgentCategoryUseCase.updatePartial(id, body);
  }
}
