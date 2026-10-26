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
  ParseIntPipe,
  Get,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { ImageUploadInterceptor } from '../../common/interceptors/image-upload.interceptor.js';
import { createImageFilePipe } from '../../common/pipes/image-file.pipe.js';
import { FileStorageService } from '../../infrastructure/storage/file-storage.service.js';
import {
  AgentInputDto,
  AgentUpdateDto,
  AgentSearchNameDto,
  AgentCreateMultipartDto,
  AgentCardMultipartDto,
} from './dtos/agent.dto.js';
import { SaveAgentUseCase } from './use-cases/agent.save.js';
import { UpdateAgentUseCase } from './use-cases/agent.update.js';
import { GetAgentCardUseCase } from './use-cases/agent.get-card.js';
import type {
  AgentUpdatePartial,
  AgentUpdateProfCard,
  FilterOptions,
} from './types/use-case.agent.types.js';
import { DeleteAgentUseCase } from './use-cases/agent.delete.js';
import { ReadAgentUseCase } from './use-cases/agent.read.js';
import type { ReadPersonneAgent } from './types/agent.types.js';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { ApiProduces } from '@nestjs/swagger';

@Controller('agents')
export class AgentController {
  constructor(
    private readonly saveAgentUseCase: SaveAgentUseCase,
    private readonly fileStorage: FileStorageService,
    private readonly updateAgentUseCase: UpdateAgentUseCase,
    private readonly deleteAgentUseCase: DeleteAgentUseCase,
    private readonly readAgentUseCase: ReadAgentUseCase,
    private readonly getAgentCardUseCase: GetAgentCardUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AgentCreateMultipartDto })
  @UseInterceptors(ImageUploadInterceptor('image'))
  async create(
    @Body() dto: AgentInputDto,
    @UploadedFile(createImageFilePipe()) image: Express.Multer.File,
  ): Promise<void> {
    const carteProfessionnellePath = await this.fileStorage.saveImage(
      image,
      'carteProfessionnelle',
    );

    try {
      await this.saveAgentUseCase.execute({ ...dto, carteProfessionnellePath });
    } catch (error) {
      await this.fileStorage.deleteImage(carteProfessionnellePath);
      throw error;
    }
  }

  @Patch(':matricule')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('matricule', ParseIntPipe) matricule: number,
    @Body() dto: AgentUpdateDto,
  ): Promise<void> {
    const inputUseCase: AgentUpdatePartial = {
      ...dto,
      matricule,
    };

    await this.updateAgentUseCase.updatePartial(inputUseCase);
  }

  @Patch(':matricule/card')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AgentCardMultipartDto })
  @UseInterceptors(ImageUploadInterceptor('image'))
  async updateProfessionalCard(
    @Param('matricule', ParseIntPipe) matricule: number,
    @UploadedFile(createImageFilePipe()) image: Express.Multer.File,
  ): Promise<void> {
    const carteProfessionnellePath = await this.fileStorage.saveImage(
      image,
      'carteProfessionnelle',
    );
    const inputUseCase: AgentUpdateProfCard = {
      matricule,
      carteProfessionnellePath,
    };

    try {
      await this.updateAgentUseCase.updateProfessionalCard(inputUseCase);
    } catch (error) {
      await this.fileStorage.deleteImage(carteProfessionnellePath);
      throw error;
    }
  }

  @Delete(':matricule')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestDeletion(@Param('matricule', ParseIntPipe) matricule: number) {
    await this.deleteAgentUseCase.request(matricule);
  }

  @Post(':matricule/deletion-validation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async validateDeletion(@Param('matricule', ParseIntPipe) matricule: number) {
    await this.deleteAgentUseCase.validate(matricule);
  }

  @Post(':matricule/deletion-rejection')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectDeletion(@Param('matricule', ParseIntPipe) matricule: number) {
    await this.deleteAgentUseCase.reject(matricule);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return await this.readAgentUseCase.findAll();
  }

  @Get('deletion-requests')
  @HttpCode(HttpStatus.OK)
  async findDeletionRequests(): Promise<ReadPersonneAgent[]> {
    return this.readAgentUseCase.findDeletionRequests();
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  async search(@Query('filter') filter: FilterOptions) {
    return await this.readAgentUseCase.findByFilter(filter);
  }

  @Get('search/last-name')
  @HttpCode(HttpStatus.OK)
  async findByLastName(@Query() query: AgentSearchNameDto) {
    return await this.readAgentUseCase.findByLastName(query.value);
  }

  @Get('search/first-name')
  @HttpCode(HttpStatus.OK)
  async findByFirstName(@Query() query: AgentSearchNameDto) {
    return await this.readAgentUseCase.findByFirstName(query.value);
  }

  @Get(':matricule/card')
  @HttpCode(HttpStatus.OK)
  @ApiProduces('image/png', 'image/jpeg', 'image/webp')
  async getProfessionalCard(
    @Param('matricule', ParseIntPipe) matricule: number,
  ): Promise<StreamableFile> {
    const { stream, mimeType, fileName } =
      await this.getAgentCardUseCase.execute(matricule);

    return new StreamableFile(stream, {
      type: mimeType,
      disposition: `inline; filename="${fileName}"`,
    });
  }
}
