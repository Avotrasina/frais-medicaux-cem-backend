import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service.js";
import { EnfantRepository } from "../repositories/enfant.repository.js";
import { PersonneRepository } from "../../personne/personne.repository.js";
import {BeneficiaryRepository} from "../../beneficiary/beneficiary.repository.js"
import type { CreateEnfant } from "../types/enfant.types.js";
import type {CreateBeneficiary} from "../../beneficiary/types/beneficiary.types.js"

@Injectable()
export class SaveEnfantUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly personneRepository: PersonneRepository,
    private readonly enfantRepository: EnfantRepository,
    private readonly beneficiaryRepository: BeneficiaryRepository
  ) {}

  async execute(input: CreateEnfant): Promise<number> {
    const { personne, agentMatricule, carteSocialePath } = input;

    return this.prisma.$transaction(async (tx) => {
      const createdPersonne = await this.personneRepository.create(
        personne,
        tx,
      );
      const enfant = await this.enfantRepository.create(
        { id: createdPersonne.id, agentMatricule, carteSocialePath },
        tx,
      );
      const beneficiary : CreateBeneficiary = {
        id:createdPersonne.id,
        codeFamille:"ENFANT",
        numEnfant:enfant.numEnfant
      }
      await this.beneficiaryRepository.create(beneficiary, tx)
      return createdPersonne.id
    });
  }
}
