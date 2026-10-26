import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  StreamableFile,
} from '@nestjs/common';
import { DeleteAttestationUseCase } from './use-cases/attestation.delete.js';
import { ReadAttestationUseCase } from './use-cases/attestation.read.js';
import { ReviewAttestationUseCase } from './use-cases/attestation.review.js';
import { SaveAttestationUseCase } from './use-cases/attestation.save.js';
import { UpdateAttestationUseCase } from './use-cases/attestation.update.js';
import { CreateAttestationDto } from './dtos/create-attestation.dto.js';
import { UpdatePartialAttestationDto } from './dtos/update-attestation.dto.js';
import { PreviewAttestation } from './use-cases/attestation.preview.js';

@Controller('attestations')
export class AttestationController {
  constructor(
    private readonly attestationDeleteUseCase: DeleteAttestationUseCase,
    private readonly attestationReadUseCase: ReadAttestationUseCase,
    private readonly attestationReviewUseCase: ReviewAttestationUseCase,
    private readonly attestationSaveUseCase: SaveAttestationUseCase,
    private readonly attestationUpdateUseCase: UpdateAttestationUseCase,
    private readonly attestationPreviewUseCase: PreviewAttestation,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAttestationDto): Promise<void> {
    await this.attestationSaveUseCase.execute(dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePartialAttestationDto,
  ) {
    await this.attestationUpdateUseCase.execute(id, dto);
  }

  @Patch(':id/approval')
  @HttpCode(HttpStatus.NO_CONTENT)
  async approve(@Param('id', ParseIntPipe) id: number) {
    await this.attestationReviewUseCase.approve(id);
  }

  @Patch(':id/rejection')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reject(@Param('id', ParseIntPipe) id: number) {
    await this.attestationReviewUseCase.reject(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.attestationDeleteUseCase.execute(id);
  }

  @Get('pending')
  @HttpCode(HttpStatus.OK)
  async findAllPending() {
    return await this.attestationReadUseCase.findPending();
  }

  @Get('beneficiaries/:idp')
  @HttpCode(HttpStatus.OK)
  async findByBeneficiary(@Param('idp') idp: string) {
    return await this.attestationReadUseCase.findValidatedByBeneficiaryIdp(idp);
  }

  @Get(':id/preview')
  @HttpCode(HttpStatus.OK)
  async preview(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StreamableFile> {
    const image = await this.attestationPreviewUseCase.execute(id);
    return new StreamableFile(image, {
      type: 'image/png',
      disposition: `inline; filename="attestation-${id}.png"`,
    });
  }
}
