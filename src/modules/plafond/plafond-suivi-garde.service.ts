import { ConflictException, Injectable } from '@nestjs/common';
import { StatutFacture } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import type { DbClient } from '../../infrastructure/prisma/db-client.type.js';

@Injectable()
export class PlafondSuiviGardeService {
  constructor(private readonly prisma: PrismaService) {}

  async verifier(dateEffet: Date, acteID: number | null, categorieActeID: number | null, tx?: DbClient): Promise<void> {
    const client = tx ?? this.prisma;
    const ligne = await client.ligneSuivi.findFirst({
      where: {
        dateActe: { gte: dateEffet },
        factureGlobale: { statut: { not: StatutFacture.SUPPRIMEE } },
        ...(acteID === null ? { acte: { categorieActeId: categorieActeID ?? undefined } } : { acteId: acteID }),
      },
      orderBy: { dateActe: 'desc' },
      select: { dateActe: true },
    });
    if (ligne !== null) {
      throw new ConflictException('La date d’effet du plafond doit être strictement postérieure à toutes les dates d’acte déjà suivies pour cette cible.');
    }
  }
}
