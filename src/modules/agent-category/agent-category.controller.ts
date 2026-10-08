import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { SaveAgentCategoryUseCase } from "./use-cases/agent-category.save.js";
import { UpdateAgentCategoryUseCase } from "./use-cases/agent-category.update.js";
import { ReadAgentCategoryUseCase } from "./use-cases/agent-category.read.js";
import {
  CreateAgentCategoryDto,
  UpdateAgentCategoryDto,
} from "./dtos/agent-category.dto.js";
import type { ReadAgentCategory } from "./types/agent-category.types.js";

@Controller("agent-categories")
export class AgentCategoryController {
  constructor(
    private readonly saveAgentCategoryUseCase: SaveAgentCategoryUseCase,
    private readonly updateAgentCategoryUseCase: UpdateAgentCategoryUseCase,
    private readonly readAgentCategoryUseCase: ReadAgentCategoryUseCase,
  ) {}

  @Post()
  async create(
    @Body() body: CreateAgentCategoryDto,
  ): Promise<ReadAgentCategory> {
    return this.saveAgentCategoryUseCase.execute(body);
  }

  @Get()
  async findAll(): Promise<ReadAgentCategory[]> {
    return this.readAgentCategoryUseCase.readAll();
  }

  @Get(":id")
  async findOne(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<ReadAgentCategory> {
    return this.readAgentCategoryUseCase.readById(id);
  }

  @Patch(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: UpdateAgentCategoryDto,
  ): Promise<ReadAgentCategory> {
    return this.updateAgentCategoryUseCase.updatePartial(id, body);
  }
}