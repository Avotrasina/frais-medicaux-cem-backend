import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { Attestation } from '../../../generated/prisma/client.js';
import type { DbClient } from '../../../infrastructure/prisma/db-client.type.js';
import {
  StatutAttestation,
  type CreateAttestation,
  type DecisionAttestation,
  type ReadAttestation,
  type UpdatePartialAttestation,
} from '../types/attestation.types.js';
import { HandlePrismaErrors } from '../../../common/decorators/handle-prisma-errors.decorator.js';
import { omitNullish } from '../../../common/utils/omit-nullish.js';

@Injectable()
@HandlePrismaErrors({ exclude: ['toReadAttestation'] })
export class AttestationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private toReadAttestation(attestation: Attestation): ReadAttestation {
    return {
      id: attestation.id,
      attestationPath: attestation.attestationPath,
      dateValidation: attestation.dateValidation,
      naturePrestation: attestation.naturePrestation,
      servicePrestataire: attestation.servicePrestataire,
      statut: StatutAttestation[attestation.statut],
      prestataireID: attestation.prestataireID,
      idpBeneficiaire: attestation.idpBeneficiaire,
      datePEC: attestation.datePEC,
      createdAt: attestation.createdAt,
      attestationStatut:attestation.statut
    };
  }

  async create(
    attestation: CreateAttestation,
    tx?: DbClient,
  ): Promise<ReadAttestation> {
    const created = await this.client(tx).attestation.create({
      data: {
        attestationPath: attestation.attestationPath,
        naturePrestation: attestation.naturePrestation,
        servicePrestataire: attestation.servicePrestataire ?? null,
        prestataireID: attestation.providerID,
        idpBeneficiaire: attestation.idpBeneficiaire,
        datePEC: attestation.datePEC,
      },
    });
    return this.toReadAttestation(created);
  }

  async findById(id: number, tx?: DbClient): Promise<ReadAttestation> {
    const attestation = await this.client(tx).attestation.findFirstOrThrow({
      where: { id },
    });
    return this.toReadAttestation(attestation);
  }

  async updateById(
    id: number,
    attestation: UpdatePartialAttestation,
    tx?: DbClient,
  ): Promise<ReadAttestation> {
    const updated = await this.client(tx).attestation.update({
      where: { id },
      data: omitNullish({
        attestationPath: attestation.attestationPath,
        naturePrestation: attestation.naturePrestation,
        servicePrestataire: attestation.servicePrestataire,
        prestataireID: attestation.prestataireID,
        idpBeneficiary: attestation.idpBenificiaire,
        datePEC: attestation.datePEC,
      }),
    });
    return this.toReadAttestation(updated);
  }

  async updateStatus(
    id: number,
    decision: DecisionAttestation,
    tx?: DbClient,
  ): Promise<ReadAttestation> {
    const updated = await this.client(tx).attestation.update({
      where: { id },
      data: {
        statut: decision,
        dateValidation:
          decision === StatutAttestation.VALIDEE ? new Date() : null,
      },
    });
    return this.toReadAttestation(updated);
  }

  async delete(id: number, tx?: DbClient): Promise<string | null> {
    const pathAttestation = await this.client(tx).attestation.findFirstOrThrow({
      where: {
        id,
      },
    });
    await this.client(tx).attestation.delete({ where: { id } });
    return pathAttestation.attestationPath;
  }

  async findAll(tx?: DbClient): Promise<ReadAttestation[]> {
    const attestations = await this.client(tx).attestation.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return attestations.map((a) => this.toReadAttestation(a));
  }

  async findByBeneficiaryIdp(
    beneficiaryIdp: string,
    tx?: DbClient,
  ): Promise<ReadAttestation[]> {
    const attestations = await this.client(tx).attestation.findMany({
      where: { idpBeneficiaire: beneficiaryIdp},
    });
    return attestations.map((attestation) =>
      this.toReadAttestation(attestation),
    );
  }
}
