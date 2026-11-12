import { Injectable } from '@nestjs/common';
import { CategorieActeRepository } from '../repositories/categorie-acte.repository.js';
import type {
  CreateCategorieActe,
  ReadCategorieActe,
} from '../types/categorie-acte.types.js';

@Injectable()
export class CreateCategorieActeUseCase {
  constructor(
    private readonly categorieActeRepository: CategorieActeRepository,
  ) {}

  async execute(input: CreateCategorieActe): Promise<ReadCategorieActe> {
    return this.categorieActeRepository.create(input);
  }
}
