import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { ImageUploadInterceptor } from "../../common/interceptors/image-upload.interceptor.js";
import { createImageFilePipe } from "../../common/pipes/image-file.pipe.js";
import { FileStorageService } from "../../infrastructure/storage/file-storage.service.js";
import {
  ConjointInputDto,
  EnfantInputDto,
  UpdatePartialFamilleAgentDto,
} from "./dtos/famille-agent.dto.js";
import { SaveConjointUseCase } from "./use-cases/conjoint.save.js";
import { SaveEnfantUseCase } from "./use-cases/enfant.save.js";
import { UpdateConjointUseCase } from "./use-cases/conjoint.update.js";
import { UpdateEnfantUseCase } from "./use-cases/enfant.update.js";
import { ReadFamilleUseCase } from "./use-cases/famille.read.js";
import type { ReadAgentFamily } from "./types/famille.agent.types.js";

@Controller("agent-family")
export class AgentFamilyController {
  constructor(
    private readonly saveConjointUseCase: SaveConjointUseCase,
    private readonly saveEnfantUseCase: SaveEnfantUseCase,
    private readonly updateConjointUseCase: UpdateConjointUseCase,
    private readonly updateEnfantUseCase: UpdateEnfantUseCase,
    private readonly readFamilleUseCase: ReadFamilleUseCase,
    private readonly fileStorage: FileStorageService,
  ) {}


  @Post("/conjoint")
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(ImageUploadInterceptor("image"))
  async createConjoint(
    @Body() dto: ConjointInputDto,
    @UploadedFile(createImageFilePipe()) image: Express.Multer.File,
  ): Promise<void> {
    const carteSocialePath = await this.fileStorage.saveImage(
      image,
      "carteSociale",
    );
    const { agentMatricule, nom, prenom, dateNaissance, sexe } = dto;

    try {
      await this.saveConjointUseCase.execute({
        agentMatricule,
        carteSocialePath,
        personne: { nom, prenom, dateNaissance, sexe },
      });
    } catch (error) {
      await this.fileStorage.deleteImage(carteSocialePath);
      throw error;
    }
  }

  @Patch("/conjoint/informations/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePartialConjoint(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePartialFamilleAgentDto,
  ): Promise<void> {
    const { nom, prenom, dateNaissance, sexe } = dto;
    await this.updateConjointUseCase.updatePartial(id, {
      personne: { nom, prenom, dateNaissance, sexe },
    });
  }

  @Patch("/conjoint/card/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(ImageUploadInterceptor("image"))
  async updateCarteSocialeConjoint(
    @Param("id", ParseIntPipe) id: number,
    @UploadedFile(createImageFilePipe()) image: Express.Multer.File,
  ): Promise<void> {
    const newCardPath = await this.fileStorage.saveImage(image, "carteSociale");

    try {
      await this.updateConjointUseCase.updateCarteSociale(id, newCardPath);
    } catch (error) {
      await this.fileStorage.deleteImage(newCardPath);
      throw error;
    }
  }


  @Post("/enfant")
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(ImageUploadInterceptor("image"))
  async createEnfant(
    @Body() dto: EnfantInputDto,
    @UploadedFile(createImageFilePipe()) image: Express.Multer.File,
  ): Promise<void> {
    const carteSocialePath = await this.fileStorage.saveImage(
      image,
      "carteSociale",
    );
    const { agentMatricule, nom, prenom, dateNaissance, sexe } = dto;

    try {
      await this.saveEnfantUseCase.execute({
        agentMatricule,
        carteSocialePath,
        personne: { nom, prenom, dateNaissance, sexe },
      });
    } catch (error) {
      await this.fileStorage.deleteImage(carteSocialePath);
      throw error;
    }
  }

  @Patch("/enfant/informations/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePartialEnfant(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePartialFamilleAgentDto,
  ): Promise<void> {
    const { nom, prenom, dateNaissance, sexe } = dto;
    await this.updateEnfantUseCase.updatePartial(id, {
      personne: { nom, prenom, dateNaissance, sexe },
    });
  }

  @Patch("/enfant/card/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(ImageUploadInterceptor("image"))
  async updateCarteSocialeEnfant(
    @Param("id", ParseIntPipe) id: number,
    @UploadedFile(createImageFilePipe()) image: Express.Multer.File,
  ): Promise<void> {
    const newCardPath = await this.fileStorage.saveImage(image, "carteSociale");

    try {
      await this.updateEnfantUseCase.updateCarteSociale(id, newCardPath);
    } catch (error) {
      await this.fileStorage.deleteImage(newCardPath);
      throw error;
    }
  }


  @Get("/:matricule")
  @HttpCode(HttpStatus.OK)
  async getByMatricule(
    @Param("matricule") matricule: string,
  ): Promise<ReadAgentFamily[]> {
    return this.readFamilleUseCase.readByMatricule(matricule);
  }
}