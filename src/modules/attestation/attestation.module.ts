import { Module } from "@nestjs/common";
import { StorageModule } from "../../infrastructure/storage/storage.module.js";
import { AgentModule } from "../agent/agent.module.js";
import { BeneficiaryModule } from "../beneficiary/beneficiary.module.js";
import { FonctionModule } from "../fonction/fonction.module.js";
import { LieuModule } from "../location/location.module.js";
import { OrganizationalStructureModule } from "../organizational_structure/organizational-structure.module.js";
import { ProviderModule } from "../provider/provider.module.js";
import { AttestationController } from "./attestation.controller.js";
import { AttestationRepository } from "./repositories/attestation.repository.js";
import { AttestationPdfService } from "./services/attesatation-pdf.service.js";
import { DeleteAttesation } from "./use-cases/attestation.delete.js";
import { ReadAttestattion } from "./use-cases/attestation.read.js";
import { ReviewAttesation } from "./use-cases/attestation.review.js";
import { SaveAttestation } from "./use-cases/attestation.save.js";
import { UpdateAttestation } from "./use-cases/attestation.update.js";

@Module({
  imports: [
    BeneficiaryModule,
    ProviderModule,
    AgentModule,
    OrganizationalStructureModule,
    FonctionModule,
    LieuModule,
    StorageModule,
  ],
  controllers: [AttestationController],
  providers: [
    AttestationRepository,
    AttestationPdfService,
    SaveAttestation,
    ReadAttestattion,
    DeleteAttesation,
    ReviewAttesation,
    UpdateAttestation,
  ],
  exports: [AttestationRepository],
})
export class AttestationModule {}
