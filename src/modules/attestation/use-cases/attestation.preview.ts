import { Injectable, NotFoundException } from '@nestjs/common';
import { FileStorageService } from '../../../infrastructure/storage/file-storage.service.js';
import { AttestationRepository } from '../repositories/attestation.repository.js';
import { AttestationPdfService } from '../services/attesatation-pdf.service.js';

@Injectable()
export class PreviewAttestation {
  constructor(
    private readonly attestationRepository: AttestationRepository,
    private readonly fileStorage: FileStorageService,
    private readonly pdfService: AttestationPdfService,
  ) {}

  async execute(id: number): Promise<Buffer> {
    const attestation = await this.attestationRepository.findById(id);

    if (!attestation.attestationPath) {
      throw new NotFoundException('Attestation not found');
    }

    const pdf = await this.fileStorage.readPdf(attestation.attestationPath);
    if (!pdf) throw new NotFoundException('PDF file not found');

    return this.pdfService.renderFirstPageAsPng(pdf);
  }
}
