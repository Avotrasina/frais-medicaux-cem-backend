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

@Controller('agent-families')
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
    if (type === 'spouses') return 'conjoint';
    if (type === 'children') return 'enfant';
    throw new BadRequestException('Type must be spouses or children');
  }

  @Delete(':type/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestDeletion(
    @Param('type') type: string,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.deletionUseCase.request(this.familyType(type), id);
  }

  @Post(':type/:id/deletion-validation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async validateDeletion(
    @Param('type') type: string,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.deletionUseCase.validate(this.familyType(type), id);
  }

  @Post(':type/:id/deletion-rejection')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectDeletion(
    @Param('type') type: string,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.deletionUseCase.reject(this.familyType(type), id);
  }

  @Get('spouses/deletion-requests')
  async findSpouseDeletionRequests(): Promise<ReadConjoint[]> {
    return this.deletionUseCase.readConjointRequests();
  }

  @Get('children/deletion-requests')
  async findChildDeletionRequests(): Promise<ReadEnfant[]> {
    return this.deletionUseCase.readEnfantRequests();
  }

  @Post('spouses')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AgentFamilyCreateMultipartDto })
  @UseInterceptors(ImageUploadInterceptor('image'))
  async createSpouse(
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

  @Patch('spouses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateSpouse(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePartialFamilleAgentDto,
  ): Promise<void> {
    const { nom, prenom, dateNaissance, sexe } = dto;
    await this.updateConjointUseCase.updatePartial(id, {
      personne: { nom, prenom, dateNaissance, sexe },
    });
  }

  @Patch('spouses/:id/card')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AgentFamilySocialCardMultipartDto })
  @UseInterceptors(ImageUploadInterceptor('image'))
  async updateSpouseCard(
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

  @Post('children')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AgentFamilyCreateMultipartDto })
  @UseInterceptors(ImageUploadInterceptor('image'))
  async createChild(
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

  @Patch('children/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateChild(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePartialFamilleAgentDto,
  ): Promise<void> {
    const { nom, prenom, dateNaissance, sexe } = dto;
    await this.updateEnfantUseCase.updatePartial(id, {
      personne: { nom, prenom, dateNaissance, sexe },
    });
  }

  @Patch('children/:id/card')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AgentFamilySocialCardMultipartDto })
  @UseInterceptors(ImageUploadInterceptor('image'))
  async updateChildCard(
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

  @Get('agents/:matricule')
  @HttpCode(HttpStatus.OK)
  async findByAgentMatricule(
    @Param('matricule', ParseIntPipe) matricule: number,
  ): Promise<ReadAgentFamily[]> {
    return this.readFamilleUseCase.findByMatricule(matricule);
  }

  @Get('family-members/:id/card')
  @HttpCode(HttpStatus.OK)
  @ApiProduces('image/png', 'image/jpeg', 'image/webp')
  async getFamilyMemberCard(
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
