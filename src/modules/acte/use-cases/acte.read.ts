import { Injectable } from '@nestjs/common';
import { dateAujourdhuiAntananarivo } from '../../../common/date.util.js';
import { PlafondResolutionService } from '../../plafond/plafond-resolution.service.js';
import type { PlafondsResolus } from '../../plafond/plafond-resolution.service.js';
import { ActeQueryDto } from '../dtos/acte-query.dto.js';
import { ActeRepository } from '../repositories/acte.repository.js';
import type { ReadActe } from '../types/acte.types.js';

@Injectable()
export class ReadActeUseCase {
  constructor(
    private readonly acteRepository: ActeRepository,
    private readonly plafondResolution: PlafondResolutionService,
  ) {}

  async findAll(query: ActeQueryDto = new ActeQueryDto()) {
    const actes = await this.acteRepository.findAll();
    if (!query.avecPlafonds) return actes;

    const resolutions = await this.plafondResolution.resoudre(
      actes.map((acte) => ({
        type: 'ACTE' as const,
        id: acte.id,
        categorieActeId: acte.categorieActeId,
      })),
      new Date(`${query.date ?? dateAujourdhuiAntananarivo()}T00:00:00.000Z`),
      query.historique,
    );
    return actes.map((acte) => {
      const resolution = resolutions.get(`ACTE:${acte.id}`);
      if (resolution === undefined) {
        throw new Error(
          `Les plafonds de l’acte ${acte.id} ne sont pas résolus.`,
        );
      }
      return this.avecPlafonds(acte, resolution);
    });
  }

  async findById(id: number): Promise<ReadActe> {
    return this.acteRepository.findById(id);
  }

  private avecPlafonds<T extends ReadActe>(
    cible: T,
    resolution: PlafondsResolus,
  ) {
    const { parActe, parAn, historique, modeleSuivi } = resolution;
    return {
      ...cible,
      plafonds: {
        parActe,
        parAn,
        ...(historique === undefined ? {} : { historique }),
      },
      modeleSuivi,
    };
  }
}
