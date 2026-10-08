import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { SaveFonctionUseCase } from "./use-cases/fonction.save.js";
import { UpdateFonctionUseCase } from "./use-cases/fonction.update.js";
import { ReadFonctionUseCase } from "./use-cases/fonction.read.js";
import { CreateFonctionDto, UpdateFonctionDto } from "./dtos/fonction.dto.js";
import type { ReadFonction } from "./types/fonction.types.js";

@Controller("fonctions")
export class FonctionController {
  constructor(
    private readonly saveFonctionUseCase: SaveFonctionUseCase,
    private readonly updateFonctionUseCase: UpdateFonctionUseCase,
    private readonly readFonctionUseCase: ReadFonctionUseCase,
  ) {}

  @Post()
  async create(@Body() body: CreateFonctionDto): Promise<ReadFonction> {
    return this.saveFonctionUseCase.execute(body);
  }

  @Get()
  async findAll(): Promise<ReadFonction[]> {
    return this.readFonctionUseCase.readAll();
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number): Promise<ReadFonction> {
    return this.readFonctionUseCase.readById(id);
  }

  @Patch(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: UpdateFonctionDto,
  ): Promise<ReadFonction> {
    return this.updateFonctionUseCase.updatePartial(id, body);
  }
}