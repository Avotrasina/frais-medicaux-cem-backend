import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { ConjointRepository } from '../repositories/conjoint.repository.js';
import { PersonneRepository } from '../../personne/repositories/personne.repository.js';
import { BeneficiaryRepository } from '../../beneficiary/repositories/beneficiary.repository.js';
import type { CreateConjoint } from '../types/conjoint.types.js';
import type { CreateBeneficiary } from '../../beneficiary/types/beneficiary.types.js';
import { EnfantInputDto } from '../dtos/famille-agent.dto.js';

@Injectable()
export class SaveConjointUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly personneRepository: PersonneRepository,
    private readonly conjointRepository: ConjointRepository,
    private readonly beneficiaryRepository: BeneficiaryRepository,
  ) {}

  async execute(input: CreateConjoint): Promise<number> {
    const { personne, agentMatricule, carteSocialePath } = input;

    return this.prisma.$transaction(async (tx) => {
      const createdPersonne = await this.personneRepository.create(
        personne,
        tx,
      );
      const conjoint = await this.conjointRepository.create(
        { id: createdPersonne.id, agentMatricule, carteSocialePath },
        tx,
      );
      const beneficiary: CreateBeneficiary = {
        id: createdPersonne.id,
        codeFamille: 'CONJOINT',
        numConjoint: conjoint.numConjoint,
        agentMatricule: conjoint.familleAgent.agentMatricule,
      };
      await this.beneficiaryRepository.create(beneficiary, tx);

      return createdPersonne.id;
    });
  }
}
