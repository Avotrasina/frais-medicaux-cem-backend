import { Injectable } from '@nestjs/common';
import { CategorieActeRepository } from '../repositories/categorie-acte.repository.js';
import type {
  ReadCategorieActe,
  UpdateCategorieActe,
} from '../types/categorie-acte.types.js';

@Injectable()
export class UpdateCategorieActeUseCase {
  constructor(
    private readonly categorieActeRepository: CategorieActeRepository,
  ) {}

  async execute(
    id: number,
    input: UpdateCategorieActe,
  ): Promise<ReadCategorieActe> {
    if (Object.keys(input).length === 0) {
      return this.categorieActeRepository.findById(id);
    }
    return this.categorieActeRepository.update(id, input);
  }
}
