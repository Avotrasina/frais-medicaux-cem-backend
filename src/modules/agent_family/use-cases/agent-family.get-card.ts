import { Injectable, NotFoundException } from "@nestjs/common";
import { basename, extname } from "node:path";
import { FamilleAgentRepository } from "../repositories/agent-family.repository.js";
import { FileStorageService } from "../../../infrastructure/storage/file-storage.service.js";
import type { AgentCardFile } from "../types/agent-family.types.js";

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

@Injectable()
export class GetFamilleCardUseCase {
  constructor(
    private readonly familleAgentRepository: FamilleAgentRepository,
    private readonly fileStorage: FileStorageService,
  ) {}

  async execute(id: number): Promise<AgentCardFile> {
    const cardPath = await this.familleAgentRepository.findCardByID(id);

    const stream = await this.fileStorage.openImage(cardPath);
    if (!stream) {
      throw new NotFoundException("Carte sociale introuvable sur le disque");
    }

    return {
      stream,
      mimeType:
        MIME_BY_EXT[extname(cardPath).toLowerCase()] ??
        "application/octet-stream",
      fileName: basename(cardPath),
    };
  }
}