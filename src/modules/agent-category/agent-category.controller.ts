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
import { DeleteAgentCategoryUseCase } from './use-cases/agent-category.delete.js';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AgentCategoryResponseDto } from './dtos/agent-category-response.dto.js';

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
  @ApiNoContentResponse({ description: 'Demande de suppression enregistrée.' })
  async requestDeletion(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deleteAgentCategoryUseCase.request(id);
  }

  @Post(':id/deletion-validation')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Suppression validée.' })
  async validateDeletion(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deleteAgentCategoryUseCase.validate(id);
  }

  @Post(':id/deletion-rejection')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Demande de suppression rejetée.' })
  async rejectDeletion(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deleteAgentCategoryUseCase.reject(id);
  }

  @Post()
  @ApiCreatedResponse({ type: AgentCategoryResponseDto })
  async create(
    @Body() body: CreateAgentCategoryDto,
  ): Promise<AgentCategoryResponseDto> {
    return this.saveAgentCategoryUseCase.execute(body);
  }

  @Get()
  @ApiOkResponse({ type: AgentCategoryResponseDto, isArray: true })
  async findAll(): Promise<AgentCategoryResponseDto[]> {
    return this.readAgentCategoryUseCase.findAll();
  }

  @Get('deletion-requests')
  @ApiOkResponse({ type: AgentCategoryResponseDto, isArray: true })
  async findDeletionRequests(): Promise<AgentCategoryResponseDto[]> {
    return this.readAgentCategoryUseCase.findDeletionRequests();
  }

  @Get(':id')
  @ApiOkResponse({ type: AgentCategoryResponseDto })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AgentCategoryResponseDto> {
    return this.readAgentCategoryUseCase.findById(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: AgentCategoryResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAgentCategoryDto,
  ): Promise<AgentCategoryResponseDto> {
    return this.updateAgentCategoryUseCase.updatePartial(id, body);
  }
}
