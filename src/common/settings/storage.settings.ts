import { resolve } from 'node:path';
import { env } from './env.validator.js';

export const STORAGE_SETTINGS = {
  root: resolve(process.cwd(), env.STORAGE_ROOT),
  maxImageSize: env.UPLOAD_MAX_IMAGE_SIZE,
} as const;

export const IMAGE_EXTENSION_BY_MIME: Readonly<Record<string, string>> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export const IMAGE_MIME_REGEX = new RegExp(
  `^(${Object.keys(IMAGE_EXTENSION_BY_MIME).join('|')})$`,
);