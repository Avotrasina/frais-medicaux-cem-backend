import {
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
} from '@nestjs/common';
import {
  IMAGE_MIME_REGEX,
  STORAGE_SETTINGS,
} from '../settings/storage.settings.js';

export const createImageFilePipe = () =>
  new ParseFilePipe({
    fileIsRequired: true,
    validators: [
      new MaxFileSizeValidator({ maxSize: STORAGE_SETTINGS.maxImageSize }),
      new FileTypeValidator({ fileType: IMAGE_MIME_REGEX }),
    ],
  });
