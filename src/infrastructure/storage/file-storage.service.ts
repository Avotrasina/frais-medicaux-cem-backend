import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { UnsupportedImageTypeException } from '../../common/errors/unsupported-image-type.exception.js';
import {
  IMAGE_EXTENSION_BY_MIME,
  STORAGE_SETTINGS,
  type ImageCategory,
  type PdfCategory,
} from '../../common/settings/storage.settings.js';
import type { StorableImage, StorablePdf } from './file-storage.types.js';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import type { Readable } from 'node:stream';

@Injectable()
export class FileStorageService {
  /** Validates the MIME type and stores the image under a generated safe name. */
  async saveImage(
    file: StorableImage,
    category: ImageCategory,
  ): Promise<string> {
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

  /** Checks that a resolved image stays within storage before opening its stream. */
  async openImage(relativePath: string): Promise<Readable | null> {
    const root = STORAGE_SETTINGS.root;
    const full = resolve(root, relativePath);

    if (!full.startsWith(root + sep)) return null;

    try {
      const info = await stat(full);
      if (!info.isFile()) return null;
    } catch {
      return null;
    }
    return createReadStream(full);
  }

  /** Checks the PDF signature and stores the file with a sanitized optional prefix. */
  async savePdf(file: StorablePdf, category: PdfCategory): Promise<string> {
    if (file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
      throw new BadRequestException('The provided file is not a valid PDF');
    }
    const directory = `${STORAGE_SETTINGS.pdfDir}/${STORAGE_SETTINGS.pdfDirs[category]}`;
    const prefix = file.name
      ? `${file.name.replace(/[^A-Za-z0-9_-]/g, '_')}-`
      : '';
    const relativePath = `${directory}/${prefix}${randomUUID()}.pdf`;

    await this.write(directory, relativePath, file.buffer);
    return relativePath;
  }

  async deletePdf(relativePath: string): Promise<void> {
    await this.remove(relativePath);
  }

  async saveFacturePdf(buffer: Buffer): Promise<string> {
    return this.savePdf({ buffer }, 'factures');
  }

  async saveFactureImage(file: StorableImage): Promise<string> {
    return this.saveImage(file, 'factures');
  }

  async openStoredFile(relativePath: string): Promise<Readable | null> {
    const full = this.resolveStoredPath(relativePath);
    if (full === null) return null;

    try {
      const info = await stat(full);
      if (!info.isFile()) return null;
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return null;
      }
      throw error;
    }
    return createReadStream(full);
  }

  async deleteStoredFile(relativePath: string): Promise<void> {
    const full = this.resolveStoredPath(relativePath);
    if (full === null) {
      throw new BadRequestException('Le chemin du fichier est invalide.');
    }
    await unlink(full).catch((error: unknown) => {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return;
      }
      throw error;
    });
  }

  /** Reads only files inside the configured root and verifies their PDF signature. */
  async readPdf(relativePath: string): Promise<Buffer | null> {
    const root = resolve(STORAGE_SETTINGS.root);
    const full = resolve(root, relativePath);

    if (!full.startsWith(root + sep)) return null;

    try {
      const buffer = await readFile(full);
      return buffer.subarray(0, 5).toString('ascii') === '%PDF-'
        ? buffer
        : null;
    } catch {
      return null;
    }
  }

  /** Creates the category directory before writing the supplied file contents. */
  private async write(
    directory: string,
    relativePath: string,
    buffer: Buffer,
  ): Promise<void> {
    const full = this.resolveStoredPath(relativePath);
    if (full === null) {
      throw new BadRequestException('Le chemin du fichier est invalide.');
    }
    await mkdir(join(STORAGE_SETTINGS.root, directory), { recursive: true });
    await writeFile(full, buffer);
  }

  /** Removes a stored file; missing paths are treated as already-cleaned files. */
  private async remove(relativePath: string): Promise<void> {
    const full = this.resolveStoredPath(relativePath);
    if (full === null) {
      throw new BadRequestException('Le chemin du fichier est invalide.');
    }
    await unlink(full).catch(
      () => undefined,
    );
  }

  private resolveStoredPath(relativePath: string): string | null {
    const root = resolve(STORAGE_SETTINGS.root);
    const full = resolve(root, relativePath);
    const cheminRelatif = relative(root, full);
    return cheminRelatif !== '' &&
      cheminRelatif !== '..' &&
      !cheminRelatif.startsWith(`..${sep}`) &&
      !isAbsolute(cheminRelatif)
      ? full
      : null;
  }
}
