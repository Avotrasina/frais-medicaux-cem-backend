import { Injectable } from '@nestjs/common';
import { CategorieActeRepository } from '../repositories/categorie-acte.repository.js';

@Injectable()
export class DeleteCategorieActeUseCase {
  constructor(
    private readonly categorieActeRepository: CategorieActeRepository,
  ) {}

  async execute(id: number): Promise<void> {
    await this.categorieActeRepository.delete(id);
  }
}
