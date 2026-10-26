import {
  Body,
  BadRequestException,
  Controller,
  Get,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ImageUploadInterceptor } from '../../common/interceptors/image-upload.interceptor.js';
import { createImageFilePipe } from '../../common/pipes/image-file.pipe.js';
import { FileStorageService } from '../../infrastructure/storage/file-storage.service.js';
import {
  ConjointInputDto,
  EnfantInputDto,
  UpdatePartialFamilleAgentDto,
  AgentFamilyCreateMultipartDto,
  AgentFamilySocialCardMultipartDto,
} from './dtos/famille-agent.dto.js';
import { SaveConjointUseCase } from './use-cases/conjoint.save.js';
import { SaveEnfantUseCase } from './use-cases/enfant.save.js';
import { UpdateConjointUseCase } from './use-cases/conjoint.update.js';
import { UpdateEnfantUseCase } from './use-cases/enfant.update.js';
import { ReadFamilleUseCase } from './use-cases/famille.read.js';
import type { ReadAgentFamily } from './types/agent-family.types.js';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { StreamableFile } from '@nestjs/common';
import { ApiProduces } from '@nestjs/swagger';
import { GetFamilleCardUseCase } from './use-cases/agent-family.get-card.js';
import { AgentFamilyDeletionUseCase } from './use-cases/agent-family.delete.js';
import type { AgentFamilyMemberType } from './types/agent-family-deletion.types.js';
import type { ReadConjoint } from './types/conjoint.types.js';
import type { ReadEnfant } from './types/enfant.types.js';

@Controller('agent-family')
export class AgentFamilyController {
  constructor(
    private readonly saveConjointUseCase: SaveConjointUseCase,
    private readonly saveEnfantUseCase: SaveEnfantUseCase,
    private readonly updateConjointUseCase: UpdateConjointUseCase,
    private readonly updateEnfantUseCase: UpdateEnfantUseCase,
    private readonly readFamilleUseCase: ReadFamilleUseCase,
    private readonly fileStorage: FileStorageService,
    private readonly getFamilleCardUseCase: GetFamilleCardUseCase,
    private readonly deletionUseCase: AgentFamilyDeletionUseCase,
  ) {}

  private familyType(type: string): AgentFamilyMemberType {
    if (type !== 'conjoint' && type !== 'enfant') {
      throw new BadRequestException('Le type doit être conjoint ou enfant');
    }
    return type;
  }

  @Delete(':type/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestDeletion(
    @Param('type') type: AgentFamilyMemberType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.deletionUseCase.request(this.familyType(type), id);
  }

  @Post(':type/:id/deletion/validate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async validateDeletion(
    @Param('type') type: AgentFamilyMemberType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.deletionUseCase.validate(this.familyType(type), id);
  }

  @Post(':type/:id/deletion/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectDeletion(
    @Param('type') type: AgentFamilyMemberType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.deletionUseCase.reject(this.familyType(type), id);
  }

  @Get('conjoint/deletion/requests')
  async getConjointDeletionRequests(): Promise<ReadConjoint[]> {
    return this.deletionUseCase.readConjointRequests();
  }

  @Get('enfant/deletion/requests')
  async getEnfantDeletionRequests(): Promise<ReadEnfant[]> {
    return this.deletionUseCase.readEnfantRequests();
  }

  @Post('/conjoint')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AgentFamilyCreateMultipartDto })
  @UseInterceptors(ImageUploadInterceptor('image'))
  async createConjoint(
    @Body() dto: ConjointInputDto,
    @UploadedFile(createImageFilePipe()) image: Express.Multer.File,
  ): Promise<void> {
    const carteSocialePath = await this.fileStorage.saveImage(
      image,
      'carteSociale',
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

  @Patch('/conjoint/informations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePartialConjoint(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePartialFamilleAgentDto,
  ): Promise<void> {
    const { nom, prenom, dateNaissance, sexe } = dto;
    await this.updateConjointUseCase.updatePartial(id, {
      personne: { nom, prenom, dateNaissance, sexe },
    });
  }

  @Patch('/conjoint/card/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AgentFamilySocialCardMultipartDto })
  @UseInterceptors(ImageUploadInterceptor('image'))
  async updateCarteSocialeConjoint(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(createImageFilePipe()) image: Express.Multer.File,
  ): Promise<void> {
    const newCardPath = await this.fileStorage.saveImage(image, 'carteSociale');

    try {
      await this.updateConjointUseCase.updateCarteSociale(id, newCardPath);
    } catch (error) {
      await this.fileStorage.deleteImage(newCardPath);
      throw error;
    }
  }

  @Post('/enfant')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AgentFamilyCreateMultipartDto })
  @UseInterceptors(ImageUploadInterceptor('image'))
  async createEnfant(
    @Body() dto: EnfantInputDto,
    @UploadedFile(createImageFilePipe()) image: Express.Multer.File,
  ): Promise<void> {
    const carteSocialePath = await this.fileStorage.saveImage(
      image,
      'carteSociale',
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

  @Patch('/enfant/informations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePartialEnfant(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePartialFamilleAgentDto,
  ): Promise<void> {
    const { nom, prenom, dateNaissance, sexe } = dto;
    await this.updateEnfantUseCase.updatePartial(id, {
      personne: { nom, prenom, dateNaissance, sexe },
    });
  }

  @Patch('/enfant/card/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AgentFamilySocialCardMultipartDto })
  @UseInterceptors(ImageUploadInterceptor('image'))
  async updateCarteSocialeEnfant(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(createImageFilePipe()) image: Express.Multer.File,
  ): Promise<void> {
    const newCardPath = await this.fileStorage.saveImage(image, 'carteSociale');

    try {
      await this.updateEnfantUseCase.updateCarteSociale(id, newCardPath);
    } catch (error) {
      await this.fileStorage.deleteImage(newCardPath);
      throw error;
    }
  }

  @Get('/:matricule')
  @HttpCode(HttpStatus.OK)
  async getByMatricule(
    @Param('matricule', ParseIntPipe) matricule: number,
  ): Promise<ReadAgentFamily[]> {
    return this.readFamilleUseCase.readByMatricule(matricule);
  }

  @Get('/card/:id')
  @HttpCode(HttpStatus.OK)
  @ApiProduces('image/png', 'image/jpeg', 'image/webp')
  async getCarteSociale(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StreamableFile> {
    const { stream, mimeType, fileName } =
      await this.getFamilleCardUseCase.execute(id);

    return new StreamableFile(stream, {
      type: mimeType,
      disposition: `inline; filename="${fileName}"`,
    });
  }
}
