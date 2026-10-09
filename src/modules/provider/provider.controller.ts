import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { SaveProviderUseCase } from "./use-cases/provider.save.js";
import { UpdateProviderUseCase } from "./use-cases/provider.update.js";
import { ReadProviderUseCase } from "./use-cases/provider.read.js";
import { CreateProviderDto, UpdateProviderDto } from "./dtos/provider.dto.js";
import type { ReadProvider } from "./types/provider.types.js";

@Controller("providers")
export class ProviderController {
  constructor(
    private readonly saveProviderUseCase: SaveProviderUseCase,
    private readonly updateProviderUseCase: UpdateProviderUseCase,
    private readonly readProviderUseCase: ReadProviderUseCase,
  ) {}

  @Post()
  async create(@Body() body: CreateProviderDto): Promise<ReadProvider> {
    return this.saveProviderUseCase.execute(body);
  }

  @Get()
  async findAll(): Promise<ReadProvider[]> {
    return this.readProviderUseCase.readAll();
  }

  @Get("filter")
  async filter(
    @Query("lieuID", new ParseIntPipe({ optional: true })) lieuID?: number,
    @Query("categorieID", new ParseIntPipe({ optional: true }))
    categorieID?: number,
  ): Promise<ReadProvider[]> {
    return this.readProviderUseCase.filter({ lieuID, categorieID });
  }

  @Patch(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: UpdateProviderDto,
  ): Promise<ReadProvider> {
    return this.updateProviderUseCase.updatePartial(id, body);
  }
}