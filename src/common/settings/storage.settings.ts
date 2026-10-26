import { resolve } from 'node:path';
import { env } from './env.validator.js';

export const IMAGE_CATEGORIES = [
  'carteProfessionnelle',
  'carteSociale',
] as const;
export type ImageCategory = (typeof IMAGE_CATEGORIES)[number];

export const PDF_CATEGORIES = ['attestation', 'convention'] as const;
export type PdfCategory = (typeof PDF_CATEGORIES)[number];

export const STORAGE_SETTINGS = {
  root: resolve(process.cwd(), env.STORAGE_ROOT),
  maxImageSize: env.UPLOAD_MAX_IMAGE_SIZE,
  imagesDir: env.STORAGE_IMAGES_DIR,
  pdfDir: env.STORAGE_PDF_DIR,
  imageSubDirs: {
    carteProfessionnelle: env.STORAGE_CARTES_PROFESSIONNELLES_DIR,
    carteSociale: env.STORAGE_CARTES_SOCIALES_DIR,
  } satisfies Record<ImageCategory, string>,
  pdfDirs: {
    attestation: env.STORAGE_PDF_ATTESTATION_DIR,
    convention: env.STORAGE_PDF_CONVENTION_DIR,
  } satisfies Record<PdfCategory, string>,
  maxPdfSize: env.UPLOAD_MAX_PDF_SIZE,
} as const;

export const PDF_MIME_TYPE = 'application/pdf';

export const IMAGE_EXTENSION_BY_MIME: Readonly<Record<string, string>> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export const IMAGE_MIME_REGEX = new RegExp(
  `^(${Object.keys(IMAGE_EXTENSION_BY_MIME).join('|')})$`,
);
