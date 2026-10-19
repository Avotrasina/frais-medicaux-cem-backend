import { Injectable, NotFoundException } from "@nestjs/common";
import { FileStorageService } from "../../../infrastructure/storage/file-storage.service.js";
import { AttestationRepository } from "../repositories/attestation.repository.js";
import { AttestationPdfService } from "../services/attesatation-pdf.service.js";

@Injectable()
export class PreviewAttestation {
  constructor(
    private readonly attestationRepository: AttestationRepository,
    private readonly fileStorage: FileStorageService,
    private readonly pdfService: AttestationPdfService,
  ) {}

  async execute(id: number): Promise<Buffer> {
    const attestation = await this.attestationRepository.findByID(id);

    if (!attestation.attestationPath) {
      throw new NotFoundException("Attestation introuvable");
    }

    const pdf = await this.fileStorage.readPdf(attestation.attestationPath);
    if (!pdf) throw new NotFoundException("Fichier PDF introuvable");

    return this.pdfService.renderFirstPageAsPng(pdf);
  }
}
