import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { UnsupportedImageTypeException } from "../../common/errors/unsupported-image-type.exception.js";
import {
  IMAGE_EXTENSION_BY_MIME,
  STORAGE_SETTINGS,
  type ImageCategory,
  type PdfCategory,
} from "../../common/settings/storage.settings.js";
import type { StorableImage, StorablePdf } from "./file-storage.types.js";

@Injectable()
export class FileStorageService {

  async saveImage(file: StorableImage, category: ImageCategory): Promise<string> {
    const extension = IMAGE_EXTENSION_BY_MIME[file.mimetype];
    if (!extension) {
      throw new UnsupportedImageTypeException(file.mimetype);
    }

    const directory = `${STORAGE_SETTINGS.imagesDir}/${STORAGE_SETTINGS.imageSubDirs[category]}`;
    const relativePath = `${directory}/${randomUUID()}${extension}`;

    await this.write(directory, relativePath, file.buffer);
    return relativePath;
  }

  async deleteImage(relativePath: string): Promise<void> {
    await this.remove(relativePath);
  }


  async savePdf(file: StorablePdf, category: PdfCategory): Promise<string> {
    const directory = STORAGE_SETTINGS.pdfDirs[category];
    const prefix = file.name
      ? `${file.name.replace(/[^A-Za-z0-9_-]/g, "_")}-`
      : "";
    const relativePath = `${directory}/${prefix}${randomUUID()}.pdf`;

    await this.write(directory, relativePath, file.buffer);
    return relativePath;
  }

  async deletePdf(relativePath: string): Promise<void> {
    await this.remove(relativePath);
  }


  private async write(
    directory: string,
    relativePath: string,
    buffer: Buffer,
  ): Promise<void> {
    await mkdir(join(STORAGE_SETTINGS.root, directory), { recursive: true });
    await writeFile(join(STORAGE_SETTINGS.root, relativePath), buffer);
  }

  private async remove(relativePath: string): Promise<void> {
    await unlink(join(STORAGE_SETTINGS.root, relativePath)).catch(
      () => undefined,
    );
  }
}