import { BadRequestException } from "@nestjs/common";

export class UnsupportedImageTypeException extends BadRequestException {
  constructor(mimetype: string) {
    super(`Type d'image non supporté : ${mimetype}`);
  }
}