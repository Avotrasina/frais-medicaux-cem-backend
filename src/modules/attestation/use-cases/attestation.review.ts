import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { AttestationRepository } from '../repositories/attestation.repository.js';
import { AttestationPdfService } from '../services/attesatation-pdf.service.js';

@Injectable()
export class ReviewAttestationUseCase {
  constructor(
    private readonly attestationRepository: AttestationRepository,
  ) {}

  async approve(attestationId: number) {
    await this.attestationRepository.updateStatus(attestationId, 'VALIDEE');
  }

  async reject(attestationId: number) {
      await this.attestationRepository.updateStatus(attestationId, 'REFUSEE');
  }
}
