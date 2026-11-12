import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { dateAujourdhuiAntananarivo } from '../../../common/date.util.js';
import { PorteePlafond, RegimeActe } from '../../../generated/prisma/enums.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
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
  ) {}

  async execute(
    id: number,
    input: UpdateActe & UpdatePlafond,
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

    if (Object.keys(donneesActe).length === 0 && !modifierPlafond) {
      return this.acteRepository.findById(id);
    }

    if (!modifierPlafond) {
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
      if ((donneesActe.regime ?? acte.regime) === RegimeActe.EXCLU) {
        throw new BadRequestException(
          'Un acte de régime EXCLU ne peut pas recevoir de plafond.',
        );
      }
      const updatedActe =
        Object.keys(donneesActe).length === 0
          ? await this.acteRepository.findById(id, tx)
          : await this.acteRepository.update(id, donneesActe, tx);
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
