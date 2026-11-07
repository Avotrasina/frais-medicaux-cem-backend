import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import type { Regle } from '../generated/prisma/client.js';
import {
  AgentConcerne,
  TypeRegle,
} from '../generated/prisma/enums.js';
import { PrismaService } from '../infrastructure/prisma/prisma.service.js';
import type {
  CreerRegleDto,
  ModifierRegleDto,
} from './dtos/regle.dto.js';

/** Détermine la catégorie de règle à appliquer au statut de l'agent. */
export function agentConcerneDepuisEstActif(estActif: boolean): AgentConcerne {
  return estActif ? AgentConcerne.ACTIF : AgentConcerne.NON_ACTIF;
}

@Injectable()
export class RegleService {
  constructor(private readonly prisma: PrismaService) {}

  /** Crée une règle après validation métier et vérification des périodes. */
  async creer(donnees: CreerRegleDto): Promise<Regle> {
    const dateEffet = convertirDate(donnees.dateEffet);
    const dateFin = donnees.dateFin ? convertirDate(donnees.dateFin) : null;
    this.validerRegle(
      donnees.type,
      donnees.agentConcerne,
      donnees.tauxCem,
      dateEffet,
      dateFin,
    );
    await this.verifierAbsenceChevauchement(
      donnees.agentConcerne,
      dateEffet,
      dateFin,
    );

    return this.prisma.regle.create({
      data: {
        type: donnees.type,
        agentConcerne: donnees.agentConcerne,
        tauxCem: new Prisma.Decimal(donnees.tauxCem),
        dateEffet,
        dateFin,
      },
    });
  }

  /** Retourne toutes les règles dans un ordre stable. */
  async lister(): Promise<Regle[]> {
    return this.prisma.regle.findMany({
      orderBy: [{ agentConcerne: 'asc' }, { dateEffet: 'desc' }, { id: 'desc' }],
    });
  }

  /** Recherche une règle par identifiant. */
  async obtenirParId(id: number): Promise<Regle> {
    const regle = await this.prisma.regle.findUnique({ where: { id } });
    if (regle === null) {
      throw new NotFoundException(`La règle ${id} est introuvable.`);
    }
    return regle;
  }

  /** Modifie une règle après validation de ses valeurs résultantes. */
  async modifier(id: number, donnees: ModifierRegleDto): Promise<Regle> {
    if (Object.keys(donnees).length === 0) {
      throw new BadRequestException(
        'Au moins un champ doit être fourni pour modifier la règle.',
      );
    }

    const existante = await this.obtenirParId(id);
    const type = donnees.type ?? existante.type;
    const agentConcerne = donnees.agentConcerne ?? existante.agentConcerne;
    const tauxCem = donnees.tauxCem ?? Number(existante.tauxCem);
    const dateEffet = donnees.dateEffet
      ? convertirDate(donnees.dateEffet)
      : existante.dateEffet;
    const dateFin =
      donnees.dateFin === undefined
        ? existante.dateFin
        : donnees.dateFin === null
          ? null
          : convertirDate(donnees.dateFin);

    this.validerRegle(type, agentConcerne, tauxCem, dateEffet, dateFin);
    await this.verifierAbsenceChevauchement(
      agentConcerne,
      dateEffet,
      dateFin,
      id,
    );

    return this.prisma.regle.update({
      where: { id },
      data: {
        type,
        agentConcerne,
        tauxCem: new Prisma.Decimal(tauxCem),
        dateEffet,
        dateFin,
      },
    });
  }

  /** Supprime une règle existante. */
  async supprimer(id: number): Promise<void> {
    await this.obtenirParId(id);
    await this.prisma.regle.delete({ where: { id } });
  }

  /** Retourne la règle dont la période inclut la date demandée. */
  async obtenirEnVigueur(
    agentConcerne: AgentConcerne,
    date: Date,
  ): Promise<Regle> {
    const regle = await this.prisma.regle.findFirst({
      where: {
        agentConcerne,
        dateEffet: { lte: date },
        OR: [{ dateFin: null }, { dateFin: { gte: date } }],
      },
      orderBy: { dateEffet: 'desc' },
    });

    if (regle === null) {
      const agentLibelle =
        agentConcerne === AgentConcerne.ACTIF
          ? 'actif'
          : 'non actif (retraité)';
      const dateFormatee = new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'short',
        timeZone: 'UTC',
      }).format(date);

      throw new NotFoundException(
        `Aucune règle de prise en charge n'est définie pour l'agent ${agentLibelle} à la date du ${dateFormatee}.`,
      );
    }

    return regle;
  }

  /** Retourne le taux CEM appliqué à la répartition des agents actifs. */
  async obtenirTauxCemRepartition(date: Date): Promise<Prisma.Decimal> {
    const regle = await this.obtenirEnVigueur(AgentConcerne.ACTIF, date);
    return regle.tauxCem;
  }

  private validerRegle(
    type: TypeRegle,
    agentConcerne: AgentConcerne,
    tauxCem: number,
    dateEffet: Date,
    dateFin: Date | null,
  ): void {
    const typeAttendu =
      agentConcerne === AgentConcerne.ACTIF
        ? TypeRegle.REPARTITION_AGENT_CEM
        : TypeRegle.CHARGE_TOTALE_CEM;
    if (type !== typeAttendu) {
      throw new BadRequestException(
        agentConcerne === AgentConcerne.ACTIF
          ? 'Un agent actif doit avoir une règle de répartition agent-CEM.'
          : 'Un agent non actif doit avoir une règle de charge totale CEM.',
      );
    }

    const tauxValide =
      (type === TypeRegle.CHARGE_TOTALE_CEM && tauxCem === 100) ||
      (type === TypeRegle.REPARTITION_AGENT_CEM &&
        tauxCem > 0 &&
        tauxCem < 100);
    if (!tauxValide) {
      throw new BadRequestException(
        type === TypeRegle.CHARGE_TOTALE_CEM
          ? 'Pour une prise en charge totale CEM, le taux CEM doit être égal à 100.'
          : 'Pour une répartition agent-CEM, le taux CEM doit être supérieur à 0 et inférieur à 100.',
      );
    }

    if (dateFin !== null && dateFin.getTime() < dateEffet.getTime()) {
      throw new BadRequestException(
        'La date de fin doit être postérieure ou égale à la date d’effet.',
      );
    }
  }

  private async verifierAbsenceChevauchement(
    agentConcerne: AgentConcerne,
    dateEffet: Date,
    dateFin: Date | null,
    idExclu?: number,
  ): Promise<void> {
    const regleChevauchante = await this.prisma.regle.findFirst({
      where: {
        agentConcerne,
        ...(idExclu === undefined ? {} : { id: { not: idExclu } }),
        ...(dateFin === null ? {} : { dateEffet: { lte: dateFin } }),
        OR: [{ dateFin: null }, { dateFin: { gte: dateEffet } }],
      },
      select: { id: true },
    });

    if (regleChevauchante !== null) {
      throw new ConflictException(
        `La période de la règle chevauche déjà celle de la règle ${regleChevauchante.id} pour l’agent concerné.`,
      );
    }
  }
}

function convertirDate(dateIso: string): Date {
  return new Date(`${dateIso}T00:00:00.000Z`);
}
