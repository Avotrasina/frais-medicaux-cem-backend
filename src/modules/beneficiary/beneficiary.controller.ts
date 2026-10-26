import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { ReadBeneficiaryUseCase } from './use-cases/beneficiary.read.js';
import { UpdateBeneficiaryUseCase } from './use-cases/beneficiary.update.js';
import { UpdateObservationBeneficiaryDto } from './dtos/update-observation-beneficiary.dto.js';
import type { ReadBeneficiary } from './types/beneficiary.types.js';

@Controller('beneficiaries')
export class BeneficiaryController {
  constructor(
    private readonly readBeneficiaryUseCase: ReadBeneficiaryUseCase,
    private readonly updateBeneficiaryUseCase: UpdateBeneficiaryUseCase,
  ) {}

  @Get('by-matricule/:matricule')
  async findByMatricule(
    @Param('matricule', ParseIntPipe) matricule: number,
  ): Promise<ReadBeneficiary[]> {
    return this.readBeneficiaryUseCase.findByMatricule(matricule);
  }

  @Get(':idp')
  async findByIdp(@Param('idp') idp: string): Promise<ReadBeneficiary> {
    return this.readBeneficiaryUseCase.findByIdp(idp);
  }

  @Patch(':idp/observation')
  async updateObservation(
    @Param('idp') idp: string,
    @Body() body: UpdateObservationBeneficiaryDto,
  ): Promise<ReadBeneficiary> {
    return await this.updateBeneficiaryUseCase.updateObservation(idp, body);
  }
}
