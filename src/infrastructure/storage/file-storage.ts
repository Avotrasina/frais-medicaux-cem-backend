import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const STORAGE_ROOT = resolve(process.cwd(), "data");
const IMAGES_DIR = "images";

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export async function saveImage(file: Express.Multer.File): Promise<string> {
  const extension = EXTENSION_BY_MIME[file.mimetype];
  if (!extension) {
    throw new Error(`Type d'image non supporté : ${file.mimetype}`);
  }

  const relativePath = `${IMAGES_DIR}/${randomUUID()}${extension}`;
  await mkdir(join(STORAGE_ROOT, IMAGES_DIR), { recursive: true });
  await writeFile(join(STORAGE_ROOT, relativePath), file.buffer);
  return relativePath;
}

export async function deleteImage(relativePath: string): Promise<void> {
  await unlink(join(STORAGE_ROOT, relativePath)).catch(() => undefined);
}