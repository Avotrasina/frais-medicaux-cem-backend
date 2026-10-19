import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Patch,
  Delete,
  UploadedFile,
  UseInterceptors,
  Param,
  Get,
  Query,
} from "@nestjs/common";
import { ImageUploadInterceptor } from "../../common/interceptors/image-upload.interceptor.js";
import { createImageFilePipe } from "../../common/pipes/image-file.pipe.js";
import { FileStorageService } from "../../infrastructure/storage/file-storage.service.js";
import {
   AgentInputDto,
   AgentUpdateDto,
   AgentSearchNameDto,
   AgentCreateMultipartDto,
   AgentCardMultipartDto
} from "./dtos/agent.dto.js";
import { SaveAgentUseCase } from "./use-cases/agent.save.js";
import {UpdateAgentUseCase} from "./use-cases/agent.update.js"
import type { AgentUpdatePartial, AgentUpdateProfCard,FilterOptions } from "./types/use-case.agent.types.js";
import { DeleteAgentUseCase } from "./use-cases/agent.delete.js";
import {ReadAgentUseCase} from  "./use-cases/agent.read.js";
import { ApiBody, ApiConsumes } from "@nestjs/swagger";

@Controller("agent")
export class AgentController{
  constructor(
    private readonly saveAgentUseCase: SaveAgentUseCase,
    private readonly fileStorage: FileStorageService,
    private readonly updateAgentUseCase: UpdateAgentUseCase,
    private readonly deleteAgentUseCase: DeleteAgentUseCase,
    private readonly readAgentUseCase: ReadAgentUseCase
  ) {}

@Post("/create/")
@HttpCode(HttpStatus.CREATED)
@ApiConsumes("multipart/form-data")
@ApiBody({ type: AgentCreateMultipartDto })
@UseInterceptors(ImageUploadInterceptor("image"))
  async create(
    @Body() dto: AgentInputDto,
    @UploadedFile(createImageFilePipe()) image: Express.Multer.File,
  ): Promise<void> {
    const carteProfessionnellePath = await this.fileStorage.saveImage(image,"carteProfessionnelle");

    try {
      await this.saveAgentUseCase.execute({ ...dto, carteProfessionnellePath });
    } catch (error) {
      await this.fileStorage.deleteImage(carteProfessionnellePath);
      throw error;
    }
  }

  @Patch("/information/:matricule")
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateAgentInformation(
    @Param("matricule") matricule: string,
    @Body() dto: AgentUpdateDto,
  ): Promise<void> {
    const inputUseCase: AgentUpdatePartial = {
      ...dto,
      matricule,
    };

    await this.updateAgentUseCase.changePartialAttribut(inputUseCase);
  }

  @Patch("/card/:matricule")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: AgentCardMultipartDto })
  @UseInterceptors(ImageUploadInterceptor("image"))
  async updateAgentProfCard(
    @Param("matricule") matricule: string,
    @UploadedFile(createImageFilePipe()) image: Express.Multer.File,
  ): Promise<void> {
    const carteProfessionnellePath = await this.fileStorage.saveImage(image,"carteProfessionnelle");
    const inputUseCase: AgentUpdateProfCard = {
      matricule,
      carteProfessionnellePath
    };

    try {
    await this.updateAgentUseCase.changeAgentProfCard(inputUseCase)
    } catch (error) {
      await this.fileStorage.deleteImage(carteProfessionnellePath);
      throw error;
    }
  }

  @Delete(":matricule")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAgent(
    @Param("matricule") matricule: string,
  ){
    await this.deleteAgentUseCase.execute(matricule)
  }

  @Get("all")
  @HttpCode(HttpStatus.OK)
  async getAll(){
    return  await this.readAgentUseCase.readAll()
  }

  @Get("all/filtered")
  @HttpCode(HttpStatus.OK)
  async getAllFiltered(
    @Query("filter") filter: FilterOptions
  ){
    return await this.readAgentUseCase.filter(filter)
  }

  @Get("search/last-name")
  @HttpCode(HttpStatus.OK)
  async getByLastName(@Query() query: AgentSearchNameDto) {
    return await this.readAgentUseCase.findByLastName(query.value);
  }

  @Get("search/first-name")
  @HttpCode(HttpStatus.OK)
  async getByFirstName(@Query() query: AgentSearchNameDto) {
    return await this.readAgentUseCase.findByFirstName(query.value);
  }
}