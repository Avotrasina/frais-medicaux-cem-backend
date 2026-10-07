import { resolve } from 'node:path';
import { env } from './env.validator.js';

export const IMAGE_CATEGORIES = ['carteProfessionnelle', 'carteSociale'] as const;
export type ImageCategory = (typeof IMAGE_CATEGORIES)[number];

export const STORAGE_SETTINGS = {
  root: resolve(process.cwd(), env.STORAGE_ROOT),
  maxImageSize: env.UPLOAD_MAX_IMAGE_SIZE,
  imagesDir: env.STORAGE_IMAGES_DIR,
  imageSubDirs: {
    carteProfessionnelle: env.STORAGE_CARTES_PROFESSIONNELLES_DIR,
    carteSociale: env.STORAGE_CARTES_SOCIALES_DIR,
  } satisfies Record<ImageCategory, string>,
} as const;

export const IMAGE_EXTENSION_BY_MIME: Readonly<Record<string, string>> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export const IMAGE_MIME_REGEX = new RegExp(
  `^(${Object.keys(IMAGE_EXTENSION_BY_MIME).join('|')})$`,
);