import { BadRequestException } from '@nestjs/common';

export class UnsupportedImageTypeException extends BadRequestException {
  constructor(mimetype: string) {
    super(`Unsupported image type: ${mimetype}`);
  }
}
