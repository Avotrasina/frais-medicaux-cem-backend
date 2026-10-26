import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { AttestationRepository } from '../repositories/attestation.repository.js';
import { AttestationPdfService } from '../services/attesatation-pdf.service.js';

@Injectable()
export class ReviewAttestationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attestationRepository: AttestationRepository,
    private readonly attestationService: AttestationPdfService,
  ) {}

  async approve(attestationId: number) {
    await this.attestationRepository.updateStatus(attestationId, 'VALIDEE');
  }

  async reject(attestationId: number) {
    await this.prisma.$transaction(async (tx) => {
      const attestation = await this.attestationRepository.findById(
        attestationId,
        tx,
      );
      await this.attestationRepository.updateStatus(attestationId, 'REFUSEE');
      attestation.attestationPath
        ? await this.attestationService.delete(attestation.attestationPath)
        : undefined;
    });
  }
}
