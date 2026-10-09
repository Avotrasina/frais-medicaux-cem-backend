import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { SaveProviderCategoryUseCase } from "./use-cases/provider-category.save.js";
import { UpdateProviderCategoryUseCase } from "./use-cases/provider-category.update.js";
import { ReadProviderCategoryUseCase } from "./use-cases/provider-category.read.js";
import {
  CreateProviderCategoryDto,
  UpdateProviderCategoryDto,
} from "./dtos/provider-category.dto.js";
import type { ReadProviderCategory } from "./types/provider-category.types.js";

@Controller("provider-categories")
export class ProviderCategoryController {
  constructor(
    private readonly saveProviderCategoryUseCase: SaveProviderCategoryUseCase,
    private readonly updateProviderCategoryUseCase: UpdateProviderCategoryUseCase,
    private readonly readProviderCategoryUseCase: ReadProviderCategoryUseCase,
  ) {}

  @Post()
  async create(
    @Body() body: CreateProviderCategoryDto,
  ): Promise<ReadProviderCategory> {
    return this.saveProviderCategoryUseCase.execute(body);
  }

  @Get()
  async findAll(): Promise<ReadProviderCategory[]> {
    return this.readProviderCategoryUseCase.readAll();
  }

  @Patch(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: UpdateProviderCategoryDto,
  ): Promise<ReadProviderCategory> {
    return this.updateProviderCategoryUseCase.updatePartial(id, body);
  }
}