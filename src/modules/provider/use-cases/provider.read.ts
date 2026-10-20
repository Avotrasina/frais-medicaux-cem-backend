import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { basename, extname } from "node:path";
import { Readable } from "node:stream";
import { ProviderRepository } from "../provider.repository.js";
import type { FilterProvider, ReadProvider } from "../types/provider.types.js";
import { ConventionRepository } from "../../convention/convention.repository.js";
import { FileStorageService } from "../../../infrastructure/storage/file-storage.service.js";
import type { ConventionStreamPart } from "../types/provider.types.js";
import type { ConventionImageReference } from "../../convention/types/convention.types.js";

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

@Injectable()
export class ReadProviderUseCase {
  constructor(
    private readonly providerRepository: ProviderRepository,
    private readonly conventionRepository: ConventionRepository,
    private readonly fileStorage: FileStorageService,
  ) {}

  async readAll(): Promise<ReadProvider[]> {
    return this.providerRepository.findAll();
  }

  async filter(filter: FilterProvider): Promise<ReadProvider[]> {
    return this.providerRepository.findByFilter(filter);
  }

  async getConventionImageReferences(
    idProvider: number,
  ): Promise<ConventionImageReference[]> {
    return this.conventionRepository.findImageReferencesByIDProvider(idProvider);
  }

  async streamConventionImage(idConvention: number): Promise<ConventionStreamPart> {
    const convention = await this.conventionRepository.findByID(idConvention);
    const stream = await this.fileStorage.openImage(convention.path);
    if (!stream) {
      throw new NotFoundException("Image de convention introuvable sur le disque");
    }

    return {
      stream,
      fileName: basename(convention.path),
      mimeType:
        MIME_BY_EXT[extname(convention.path).toLowerCase()] ??
        "application/octet-stream",
    };
  }

  async streamConventions(idProvider: number): Promise<{
    stream: Readable;
    boundary: string;
  }> {
    const conventions = await this.conventionRepository.findByIDProvider(idProvider);
    if (conventions.length === 0) {
      throw new NotFoundException("Aucune image de convention trouvée pour ce provider");
    }

    const parts: ConventionStreamPart[] = [];
    try {
      for (const convention of conventions) {
        const stream = await this.fileStorage.openImage(convention.path);
        if (!stream) {
          throw new NotFoundException("Une image de convention est introuvable sur le disque");
        }
        parts.push({
          stream,
          fileName: basename(convention.path),
          mimeType: MIME_BY_EXT[extname(convention.path).toLowerCase()] ?? "application/octet-stream",
        });
      }
    } catch (error) {
      for (const part of parts) part.stream.destroy();
      throw error;
    }

    const boundary = `conventions-${randomUUID()}`;
    async function* multipartBody(): AsyncGenerator<Buffer> {
      for (const part of parts) {
        yield Buffer.from(
          `--${boundary}\r\n` +
            `Content-Type: ${part.mimeType}\r\n` +
            `Content-Disposition: inline; filename="${part.fileName}"\r\n\r\n`,
        );
        for await (const chunk of part.stream) {
          yield Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        }
        yield Buffer.from("\r\n");
      }
      yield Buffer.from(`--${boundary}--\r\n`);
    }

    return { stream: Readable.from(multipartBody()), boundary };
  }
}
