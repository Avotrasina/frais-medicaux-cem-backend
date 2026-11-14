import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { AttestationRepository } from '../repositories/attestation.repository.js';
import { AttestationPdfService } from '../services/attesatation-pdf.service.js';
import { bool } from 'envalid';

@Injectable()
export class DeleteAttestationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attestationRepository: AttestationRepository,
    private readonly attestationService: AttestationPdfService,
  ) {}

  async execute(attestationId: number) {
    let isdeleted: boolean = false;
    await this.prisma
      .$transaction(async () => {
        const attestationPath =
          await this.attestationRepository.delete(attestationId);
        if (attestationPath) {
          await this.attestationService.delete(attestationPath);
          isdeleted = true;
        }
      })
      .catch(async () => {
        if (isdeleted) {
        }
      });
  }
}
