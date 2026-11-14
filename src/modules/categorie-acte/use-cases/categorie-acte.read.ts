import { Injectable } from '@nestjs/common';
import { dateAujourdhuiAntananarivo } from '../../../common/date.util.js';
import { PlafondResolutionService } from '../../plafond/plafond-resolution.service.js';
import type {
  CiblePlafond,
  PlafondsResolus,
} from '../../plafond/plafond-resolution.service.js';
import { CategorieActeQueryDto } from '../dtos/categorie-acte-query.dto.js';
import { CategorieActeRepository } from '../repositories/categorie-acte.repository.js';
import type { ReadActe } from '../../acte/types/acte.types.js';
import type { ReadCategorieActe } from '../types/categorie-acte.types.js';

type CategorieAvecActes = ReadCategorieActe & { actes: ReadActe[] };

function contientActes(
  categorie: ReadCategorieActe | CategorieAvecActes,
): categorie is CategorieAvecActes {
  return 'actes' in categorie;
}

@Injectable()
export class ReadCategorieActeUseCase {
  constructor(
    private readonly categorieActeRepository: CategorieActeRepository,
    private readonly plafondResolution: PlafondResolutionService,
  ) {}

  async findAll(query: CategorieActeQueryDto = new CategorieActeQueryDto()) {
    const categories: Array<ReadCategorieActe | CategorieAvecActes> =
      query.inclureActes
        ? await this.categorieActeRepository.findAllWithActes()
        : await this.categorieActeRepository.findAll();
    if (!query.avecPlafonds && !query.inclureActes) return categories;

    const cibles: CiblePlafond[] = categories.flatMap((categorie) => [
      ...(query.avecPlafonds
        ? [{ type: 'CATEGORIE' as const, id: categorie.id }]
        : []),
      ...(contientActes(categorie)
        ? categorie.actes.map((acte) => ({
            type: 'ACTE' as const,
            id: acte.id,
            categorieActeId: acte.categorieActeId,
          }))
        : []),
    ]);
    const resolutions = await this.plafondResolution.resoudre(
      cibles,
      new Date(`${query.date ?? dateAujourdhuiAntananarivo()}T00:00:00.000Z`),
      query.historique,
    );
    return categories.map((categorie) => {
      const categorieResolue = query.avecPlafonds
        ? this.avecPlafonds(
            categorie,
            this.obtenirResolution(resolutions, {
              type: 'CATEGORIE',
              id: categorie.id,
            }),
          )
        : categorie;
      if (!contientActes(categorie)) return categorieResolue;
      return {
        ...categorieResolue,
        actes: categorie.actes.map((acte) =>
          this.avecPlafonds(
            acte,
            this.obtenirResolution(resolutions, {
              type: 'ACTE',
              id: acte.id,
              categorieActeId: acte.categorieActeId,
            }),
          ),
        ),
      };
    });
  }

  async findById(id: number): Promise<ReadCategorieActe> {
    return this.categorieActeRepository.findById(id);
  }

  private obtenirResolution(
    resolutions: Map<string, PlafondsResolus>,
    cible: CiblePlafond,
  ): PlafondsResolus {
    const resolution = resolutions.get(this.plafondResolution.cleCible(cible));
    if (resolution === undefined) {
      throw new Error(
        `Les plafonds de la cible ${cible.type}:${cible.id} ne sont pas résolus.`,
      );
    }
    return resolution;
  }

  private avecPlafonds<T extends object>(
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
