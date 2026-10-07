import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { UnsupportedImageTypeException } from "../../common/errors/unsupported-image-type.exception.js";
import {
  IMAGE_EXTENSION_BY_MIME,
  STORAGE_SETTINGS,
} from "../../common/settings/storage.settings.js";
import type { StorableImage } from "./file-storage.types.js";

const IMAGES_DIR = "images";

@Injectable()
export class FileStorageService {
  async saveImage(file: StorableImage): Promise<string> {
    const extension = IMAGE_EXTENSION_BY_MIME[file.mimetype];
    if (!extension) {
      throw new UnsupportedImageTypeException(file.mimetype);
    }

    const relativePath = `${IMAGES_DIR}/${randomUUID()}${extension}`;
    await mkdir(join(STORAGE_SETTINGS.root, IMAGES_DIR), { recursive: true });
    await writeFile(join(STORAGE_SETTINGS.root, relativePath), file.buffer);
    return relativePath;
  }

  async deleteImage(relativePath: string): Promise<void> {
    await unlink(join(STORAGE_SETTINGS.root, relativePath)).catch(
      () => undefined,
    );
  }
}