import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PorteePlafond, RegimeActe } from '../../../generated/prisma/enums.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { ConstraintRulesService } from '../../plafond/contrainte-rules.service.js';
import type { PlafondsModificationDto } from '../../plafond/dtos/plafond.dto.js';
import { UpdatePlafondUseCase } from '../../plafond/use-cases/plafond.update.js';
import type { UpdatePlafond } from '../../plafond/types/plafond.types.js';
import { ActeRepository } from '../repositories/acte.repository.js';
import type { ReadActe, UpdateActe } from '../types/acte.types.js';

@Injectable()
export class UpdateActeUseCase {
  constructor(
    private readonly acteRepository: ActeRepository,
    private readonly prisma: PrismaService,
    private readonly updatePlafond: UpdatePlafondUseCase,
    private readonly contraintes: ConstraintRulesService,
  ) {}

  async execute(
    id: number,
    input: UpdateActe & UpdatePlafond & { plafonds?: PlafondsModificationDto | null },
  ): Promise<ReadActe> {
    const {
      dateEffet,
      dateFin,
      porteePlafond,
      unite,
      montant,
      nbSeances,
      acteID: _acteID,
      categorieActeID: _categorieActeID,
      plafonds,
      ...donneesActe
    } = input;
    const plafondInput: UpdatePlafond = {
      dateEffet,
      dateFin,
      porteePlafond,
      unite,
      montant,
      nbSeances,
      acteID: input.acteID,
      categorieActeID: input.categorieActeID,
    };
    const modifierPlafond = Object.values(plafondInput).some(
      (valeur) => valeur !== undefined,
    );

    if (plafonds !== undefined && modifierPlafond) {
      throw new BadRequestException(
        'Utilisez soit le champ plafonds, soit les champs de plafond hérités, mais pas les deux.',
      );
    }

    if (Object.keys(donneesActe).length === 0 && !modifierPlafond && plafonds === undefined) {
      return this.acteRepository.findById(id);
    }

    if (plafonds === undefined && !modifierPlafond) {
      return this.acteRepository.update(id, donneesActe);
    }

    return this.prisma.$transaction(async (tx) => {
      const acte = await tx.acte.findUnique({
        where: { id },
        select: { id: true, regime: true, categorieActeId: true },
      });
      if (acte === null) {
        throw new NotFoundException(`L’acte ${id} est introuvable.`);
      }
      if (plafonds !== undefined && plafonds !== null) {
        if ((donneesActe.regime ?? acte.regime) === RegimeActe.EXCLU) {
          throw new BadRequestException(
            'Un acte de régime EXCLU ne peut pas recevoir de plafond.',
          );
        }
        // Rule 1: the act inherits the constraint of its category.
        await this.contraintes.assertActeWithoutOwnConstraint(
          acte.categorieActeId,
          tx,
        );
      }
      const updatedActe =
        Object.keys(donneesActe).length === 0
          ? await this.acteRepository.findById(id, tx)
          : await this.acteRepository.update(id, donneesActe, tx);
      if (plafonds !== undefined) {
        await this.contraintes.applyConstraint({ type: 'ACTE', id }, plafonds, tx);
        return updatedActe;
      }
      const plafond = await this.updatePlafond.executePourCible(
        { type: 'ACTE', id },
        plafondInput,
        tx,
      );
      if (plafond.porteePlafond === PorteePlafond.PAR_AN) {
        const dateReference = new Date(`${plafond.dateEffet}T00:00:00.000Z`);
        const plafondCategorie = await tx.plafond.findFirst({
          where: {
            categorieActeID: acte.categorieActeId,
            porteePlafond: PorteePlafond.PAR_AN,
            dateEffet: { lte: dateReference },
            OR: [{ dateFin: null }, { dateFin: { gte: dateReference } }],
          },
          select: { id: true },
        });
        if (plafondCategorie !== null) {
          throw new ConflictException(
            'La catégorie possède déjà un plafond annuel en vigueur ; le plafond annuel doit rester partagé au niveau de la catégorie.',
          );
        }
      }
      return updatedActe;
    });
  }
}
