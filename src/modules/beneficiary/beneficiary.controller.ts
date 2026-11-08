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
import { ApiOkResponse } from '@nestjs/swagger';
import { BeneficiaryResponseDto } from './dtos/beneficiary-response.dto.js';

@Controller('beneficiaries')
export class BeneficiaryController {
  constructor(
    private readonly readBeneficiaryUseCase: ReadBeneficiaryUseCase,
    private readonly updateBeneficiaryUseCase: UpdateBeneficiaryUseCase,
  ) {}

  @Get('by-matricule/:matricule')
  @ApiOkResponse({ type: BeneficiaryResponseDto, isArray: true })
  async findByMatricule(
    @Param('matricule', ParseIntPipe) matricule: number,
  ): Promise<BeneficiaryResponseDto[]> {
    return this.readBeneficiaryUseCase.findByMatricule(matricule);
  }

  @Get(':idp')
  @ApiOkResponse({ type: BeneficiaryResponseDto })
  async findByIdp(@Param('idp') idp: string): Promise<BeneficiaryResponseDto> {
    return this.readBeneficiaryUseCase.findByIdp(idp);
  }

  @Patch(':idp/observation')
  @ApiOkResponse({ type: BeneficiaryResponseDto })
  async updateObservation(
    @Param('idp') idp: string,
    @Body() body: UpdateObservationBeneficiaryDto,
  ): Promise<BeneficiaryResponseDto> {
    return await this.updateBeneficiaryUseCase.updateObservation(idp, body);
  }
}
