import { Injectable } from '@nestjs/common';
import { DirectionRepository } from '../repositories/direction.repository.js';
import type { UpdateDirection } from '../types/direction.types.js';
import type { UpdateDirectionUseCaseInput } from '../types/use-case.structure-orga.types.js';

@Injectable()
export class UpdateDirectionUseCase {
  constructor(private readonly directionRepository: DirectionRepository) {}

  private toUpdateDirection(
    input: UpdateDirectionUseCaseInput,
  ): UpdateDirection {
    return { nom: input.nomDirection };
  }

  async execute(input: UpdateDirectionUseCaseInput): Promise<void> {
    await this.directionRepository.update(
      input.codeDirection,
      this.toUpdateDirection(input),
    );
  }
}
