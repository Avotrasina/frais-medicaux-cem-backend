import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { STORAGE_SETTINGS } from '../settings/storage.settings.js';

export const ImageUploadInterceptor = (fieldName = 'image') =>
  FileInterceptor(fieldName, {
    storage: memoryStorage(),
    limits: { fileSize: STORAGE_SETTINGS.maxImageSize },
  });
