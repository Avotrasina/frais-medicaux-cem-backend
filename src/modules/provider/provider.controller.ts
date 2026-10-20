import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  BadRequestException,
  StreamableFile,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import {
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiProduces,
  getSchemaPath,
} from "@nestjs/swagger";
import { FileStorageService } from "../../infrastructure/storage/file-storage.service.js";
import { STORAGE_SETTINGS } from "../../common/settings/storage.settings.js";
import { SaveProviderUseCase } from "./use-cases/provider.save.js";
import { UpdateProviderUseCase } from "./use-cases/provider.update.js";
import { ReadProviderUseCase } from "./use-cases/provider.read.js";
import { CreateProviderDto, UpdateProviderDto } from "./dtos/provider.dto.js";
import type { ReadProvider } from "./types/provider.types.js";
import { UpdateProviderConventionUseCase } from "./use-cases/provider-convention.update.js";
import type { ReadConvenion } from "../convention/types/convention.types.js";

@Controller("providers")
@ApiExtraModels(CreateProviderDto)
export class ProviderController {
  constructor(
    private readonly saveProviderUseCase: SaveProviderUseCase,
    private readonly updateProviderUseCase: UpdateProviderUseCase,
    private readonly readProviderUseCase: ReadProviderUseCase,
    private readonly fileStorage: FileStorageService,
    private readonly updateProviderConventionUseCase: UpdateProviderConventionUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(CreateProviderDto) },
        {
          type: "object",
          required: ["conventions"],
          properties: {
            conventions: {
              type: "array",
              items: { type: "string", format: "binary" },
            },
          },
        },
      ],
    },
  })
  @UseInterceptors(
    FilesInterceptor("conventions", 5, {
      storage: memoryStorage(),
      limits: { fileSize: STORAGE_SETTINGS.maxImageSize },
    }),
  )
  async create(
    @Body() body: CreateProviderDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ): Promise<ReadProvider> {
    if (files.length === 0) {
      throw new BadRequestException("Au moins une image de convention est requise");
    }
    const paths: string[] = [];
    try {
      for (const file of files) {
        paths.push(await this.fileStorage.saveImage(file, "convention"));
      }
      return await this.saveProviderUseCase.execute(body, paths);
    } catch (error) {
      await Promise.all(paths.map((path) => this.fileStorage.deleteImage(path)));
      throw error;
    }
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

  @Get(":idProvider/conventions/image-list")
  @ApiProduces("multipart/mixed")
  async getConventions(
    @Param("idProvider", ParseIntPipe) idProvider: number,
  ): Promise<StreamableFile> {
    const { stream, boundary } =
      await this.readProviderUseCase.streamConventions(idProvider);
    return new StreamableFile(stream, {
      type: `multipart/mixed; boundary=${boundary}`,
      disposition: "inline",
    });
  }

  @Get(":idProvider/convention")
  async getConventionImageReferences(
    @Param("idProvider", ParseIntPipe) idProvider: number,
  ) {
    return this.readProviderUseCase.getConventionImageReferences(idProvider);
  }

  @Get("convention/image/:idConvention")
  @ApiProduces("image/jpeg", "image/png", "image/webp")
  async getConventionImage(
    @Param("idConvention", ParseIntPipe) idConvention: number,
  ): Promise<StreamableFile> {
    const { stream, fileName, mimeType } =
      await this.readProviderUseCase.streamConventionImage(idConvention);
    return new StreamableFile(stream, {
      type: mimeType,
      disposition: `inline; filename="${fileName}"`,
    });
  }

  @Patch("information/:idProvider")
  async update(
    @Param("idProvider", ParseIntPipe) idProvider: number,
    @Body() body: UpdateProviderDto,
  ): Promise<ReadProvider> {
    return this.updateProviderUseCase.updatePartial(idProvider, body);
  }

  @Patch("convention/:idProvider")
  @HttpCode(HttpStatus.OK)
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["conventions"],
      properties: {
        conventions: {
          type: "array",
          items: { type: "string", format: "binary" },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor("conventions", 20, {
      storage: memoryStorage(),
      limits: { fileSize: STORAGE_SETTINGS.maxImageSize },
    }),
  )
  async updateConventions(
    @Param("idProvider", ParseIntPipe) idProvider: number,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ): Promise<ReadConvenion[]> {
    if (files.length === 0) {
      throw new BadRequestException("Au moins une image de convention est requise");
    }

    const newPaths: string[] = [];
    try {
      for (const file of files) {
        newPaths.push(await this.fileStorage.saveImage(file, "convention"));
      }
      return await this.updateProviderConventionUseCase.execute(idProvider, newPaths);
    } catch (error) {
      await Promise.all(newPaths.map((path) => this.fileStorage.deleteImage(path)));
      throw error;
    }
  }
}
