import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { SaveLieuUseCase } from "./use-cases/location.save.js";
import { UpdateLieuUseCase } from "./use-cases/location.update.js";
import { ReadLieuUseCase } from "./use-cases/location.read.js";
import { CreateLieuDto, UpdateLieuDto } from "./dtos/location.dto.js";
import type { ReadLieu } from "./types/location.types.js";

@Controller("lieux")
export class LieuController {
  constructor(
    private readonly saveLieuUseCase: SaveLieuUseCase,
    private readonly updateLieuUseCase: UpdateLieuUseCase,
    private readonly readLieuUseCase: ReadLieuUseCase,
  ) {}

  @Post()
  async create(@Body() body: CreateLieuDto): Promise<ReadLieu> {
    return this.saveLieuUseCase.execute(body);
  }

  @Get()
  async findAll(): Promise<ReadLieu[]> {
    return this.readLieuUseCase.readAll();
  }

  @Patch(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: UpdateLieuDto,
  ): Promise<ReadLieu> {
    return this.updateLieuUseCase.updatePartial(id, body);
  }
}