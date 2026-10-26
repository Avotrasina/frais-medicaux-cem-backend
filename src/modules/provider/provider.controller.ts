import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  BadRequestException,
  StreamableFile,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiProduces,
  getSchemaPath,
} from '@nestjs/swagger';
import { FileStorageService } from '../../infrastructure/storage/file-storage.service.js';
import {
  PDF_MIME_TYPE,
  STORAGE_SETTINGS,
} from '../../common/settings/storage.settings.js';
import { SaveProviderUseCase } from './use-cases/provider.save.js';
import { UpdateProviderUseCase } from './use-cases/provider.update.js';
import { ReadProviderUseCase } from './use-cases/provider.read.js';
import { CreateProviderDto, UpdateProviderDto } from './dtos/provider.dto.js';
import type { ReadProvider } from './types/provider.types.js';
import { UpdateProviderConventionUseCase } from './use-cases/provider-convention.update.js';
import { ProviderTreeDeletionUseCase } from './provider-tree.delete.js';

@Controller('providers')
@ApiExtraModels(CreateProviderDto)
export class ProviderController {
  constructor(
    private readonly saveProviderUseCase: SaveProviderUseCase,
    private readonly updateProviderUseCase: UpdateProviderUseCase,
    private readonly readProviderUseCase: ReadProviderUseCase,
    private readonly fileStorage: FileStorageService,
    private readonly updateProviderConventionUseCase: UpdateProviderConventionUseCase,
    private readonly deletionUseCase: ProviderTreeDeletionUseCase,
  ) {}

  @Delete(':idProvider')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestDeletion(
    @Param('idProvider', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.deletionUseCase.request('prestataire', id);
  }

  @Post(':idProvider/deletion/validate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async validateDeletion(
    @Param('idProvider', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.deletionUseCase.validate('prestataire', id);
  }

  @Post(':idProvider/deletion/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectDeletion(
    @Param('idProvider', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.deletionUseCase.reject('prestataire', id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(CreateProviderDto) },
        {
          type: 'object',
          required: ['convention'],
          properties: {
            convention: { type: 'string', format: 'binary' },
          },
        },
      ],
    },
  })
  @UseInterceptors(
    FileInterceptor('convention', {
      storage: memoryStorage(),
      limits: { fileSize: STORAGE_SETTINGS.maxPdfSize },
      fileFilter: (_req, file, callback) =>
        file.mimetype === PDF_MIME_TYPE
          ? callback(null, true)
          : callback(
              new BadRequestException(
                'Le fichier de convention doit être un PDF',
              ),
              false,
            ),
    }),
  )
  async create(
    @Body() body: CreateProviderDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ReadProvider> {
    if (!file) {
      throw new BadRequestException('Le PDF de convention est requis');
    }
    let path: string | undefined;
    try {
      path = await this.fileStorage.savePdf(file, 'convention');
      return await this.saveProviderUseCase.execute(body, path);
    } catch (error) {
      if (path) await this.fileStorage.deletePdf(path);
      throw error;
    }
  }

  @Get()
  async findAll(): Promise<ReadProvider[]> {
    return this.readProviderUseCase.readAll();
  }

  @Get('deletion/requests')
  async findDeletionRequests(): Promise<ReadProvider[]> {
    return this.readProviderUseCase.readDeletionRequests();
  }

  @Get('filter')
  async filter(
    @Query('lieuID', new ParseIntPipe({ optional: true })) lieuID?: number,
    @Query('categorieID', new ParseIntPipe({ optional: true }))
    categorieID?: number,
  ): Promise<ReadProvider[]> {
    return this.readProviderUseCase.filter({ lieuID, categorieID });
  }

  @Get(':idProvider/convention')
  @ApiProduces('application/pdf')
  async getConvention(
    @Param('idProvider', ParseIntPipe) idProvider: number,
  ): Promise<StreamableFile> {
    const { buffer, fileName } =
      await this.readProviderUseCase.readConvention(idProvider);
    return new StreamableFile(buffer, {
      type: PDF_MIME_TYPE,
      disposition: `inline; filename="${fileName}"`,
    });
  }

  @Patch('information/:idProvider')
  async update(
    @Param('idProvider', ParseIntPipe) idProvider: number,
    @Body() body: UpdateProviderDto,
  ): Promise<ReadProvider> {
    return this.updateProviderUseCase.updatePartial(idProvider, body);
  }

  @Patch('convention/:idProvider')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['convention'],
      properties: {
        convention: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('convention', {
      storage: memoryStorage(),
      limits: { fileSize: STORAGE_SETTINGS.maxPdfSize },
      fileFilter: (_req, file, callback) =>
        file.mimetype === PDF_MIME_TYPE
          ? callback(null, true)
          : callback(
              new BadRequestException(
                'Le fichier de convention doit être un PDF',
              ),
              false,
            ),
    }),
  )
  async updateConvention(
    @Param('idProvider', ParseIntPipe) idProvider: number,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ReadProvider> {
    if (!file) {
      throw new BadRequestException('Le PDF de convention est requis');
    }

    let newPath: string | undefined;
    try {
      newPath = await this.fileStorage.savePdf(file, 'convention');
      return await this.updateProviderConventionUseCase.execute(
        idProvider,
        newPath,
      );
    } catch (error) {
      if (newPath) await this.fileStorage.deletePdf(newPath);
      throw error;
    }
  }
}
