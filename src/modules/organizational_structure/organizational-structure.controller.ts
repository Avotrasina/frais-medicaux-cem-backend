import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Delete,
} from '@nestjs/common';
import { CreateAgenceUseCase } from './use-cases/agence.save.js';
import { UpdateAgenceUseCase } from './use-cases/agence.update.js';
import { ReadAllAgencesUseCase } from './use-cases/agence.read.js';
import { CreateDirectionUseCase } from './use-cases/direction.save.js';
import { UpdateDirectionUseCase } from './use-cases/direction.update.js';
import { ReadAllDirectionsUseCase } from './use-cases/direction.read.js';
import { CreateServiceUseCase } from './use-cases/service.save.js';
import { UpdateServiceUseCase } from './use-cases/service.update.js';
import { ReadServiceUseCase } from './use-cases/service.read.js';
import { CreateAgenceDto, UpdateAgenceDto } from './dtos/agence.dto.js';
import {
  CreateDirectionDto,
  UpdateDirectionDto,
} from './dtos/direction.dto.js';
import {
  CreateServiceDto,
  UpdateServiceCodeDirectionDto,
  UpdateServiceNomDto,
} from './dtos/service.dto.js';
import type { ReadAgence } from './types/agence.types.js';
import type { ReadDirectionWithServices } from './types/direction.types.js';
import type { ReadService } from './types/service.types.js';
import { DeleteOrganizationalStructureUseCase } from './use-cases/structure.delete.js';

@Controller('structure-organisationnelle')
export class StructureOrganisationnelleController {
  constructor(
    private readonly createAgenceUseCase: CreateAgenceUseCase,
    private readonly updateAgenceUseCase: UpdateAgenceUseCase,
    private readonly readAllAgencesUseCase: ReadAllAgencesUseCase,
    private readonly createDirectionUseCase: CreateDirectionUseCase,
    private readonly updateDirectionUseCase: UpdateDirectionUseCase,
    private readonly readAllDirectionsUseCase: ReadAllDirectionsUseCase,
    private readonly createServiceUseCase: CreateServiceUseCase,
    private readonly updateServiceUseCase: UpdateServiceUseCase,
    private readonly readServiceUseCase: ReadServiceUseCase,
    private readonly deleteStructureUseCase: DeleteOrganizationalStructureUseCase,
  ) {}

  @Delete('agences/:codeAgence')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestAgenceDeletion(@Param('codeAgence') id: string): Promise<void> {
    await this.deleteStructureUseCase.request('agence', id);
  }

  @Post('agences/:codeAgence/deletion/validate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async validateAgenceDeletion(@Param('codeAgence') id: string): Promise<void> {
    await this.deleteStructureUseCase.validate('agence', id);
  }

  @Post('agences/:codeAgence/deletion/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectAgenceDeletion(@Param('codeAgence') id: string): Promise<void> {
    await this.deleteStructureUseCase.reject('agence', id);
  }

  @Delete('directions/:codeDirection')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestDirectionDeletion(
    @Param('codeDirection') id: string,
  ): Promise<void> {
    await this.deleteStructureUseCase.request('direction', id);
  }

  @Post('directions/:codeDirection/deletion/validate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async validateDirectionDeletion(
    @Param('codeDirection') id: string,
  ): Promise<void> {
    await this.deleteStructureUseCase.validate('direction', id);
  }

  @Post('directions/:codeDirection/deletion/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectDirectionDeletion(
    @Param('codeDirection') id: string,
  ): Promise<void> {
    await this.deleteStructureUseCase.reject('direction', id);
  }

  @Delete('services/:codeService')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestServiceDeletion(
    @Param('codeService') id: string,
  ): Promise<void> {
    await this.deleteStructureUseCase.request('service', id);
  }

  @Post('services/:codeService/deletion/validate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async validateServiceDeletion(
    @Param('codeService') id: string,
  ): Promise<void> {
    await this.deleteStructureUseCase.validate('service', id);
  }

  @Post('services/:codeService/deletion/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectServiceDeletion(@Param('codeService') id: string): Promise<void> {
    await this.deleteStructureUseCase.reject('service', id);
  }

  @Post('agences')
  @HttpCode(HttpStatus.CREATED)
  async createAgence(@Body() dto: CreateAgenceDto): Promise<void> {
    await this.createAgenceUseCase.execute(dto);
  }

  @Get('agences')
  async readAllAgences(): Promise<ReadAgence[]> {
    return this.readAllAgencesUseCase.execute();
  }

  @Get('agences/deletion/requests')
  async readAgenceDeletionRequests(): Promise<ReadAgence[]> {
    return this.readAllAgencesUseCase.readDeletionRequests();
  }

  @Patch('agences/:codeAgence')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateAgence(
    @Param('codeAgence') codeAgence: string,
    @Body() dto: UpdateAgenceDto,
  ): Promise<void> {
    await this.updateAgenceUseCase.execute({
      codeAgence,
      nomAgence: dto.nomAgence,
    });
  }

  @Post('directions')
  @HttpCode(HttpStatus.CREATED)
  async createDirection(@Body() dto: CreateDirectionDto): Promise<void> {
    await this.createDirectionUseCase.execute(dto);
  }

  @Get('directions')
  async readAllDirections(): Promise<ReadDirectionWithServices[]> {
    return this.readAllDirectionsUseCase.execute();
  }

  @Get('directions/deletion/requests')
  async readDirectionDeletionRequests(): Promise<ReadDirectionWithServices[]> {
    return this.readAllDirectionsUseCase.readDeletionRequests();
  }

  @Patch('directions/:codeDirection')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateDirection(
    @Param('codeDirection') codeDirection: string,
    @Body() dto: UpdateDirectionDto,
  ): Promise<void> {
    await this.updateDirectionUseCase.execute({
      codeDirection,
      nomDirection: dto.nomDirection,
    });
  }

  @Get('directions/:codeDirection/services')
  async readServicesByDirection(
    @Param('codeDirection') codeDirection: string,
  ): Promise<ReadService[]> {
    return this.readServiceUseCase.readByDirection({ codeDirection });
  }

  @Post('services')
  @HttpCode(HttpStatus.CREATED)
  async createService(@Body() dto: CreateServiceDto): Promise<void> {
    await this.createServiceUseCase.execute(dto);
  }

  @Get('services')
  async readAllServices(): Promise<ReadService[]> {
    return this.readServiceUseCase.readAll();
  }

  @Get('services/deletion/requests')
  async readServiceDeletionRequests(): Promise<ReadService[]> {
    return this.readServiceUseCase.readDeletionRequests();
  }

  @Patch('services/:codeService/nom')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateServiceNom(
    @Param('codeService') codeService: string,
    @Body() dto: UpdateServiceNomDto,
  ): Promise<void> {
    await this.updateServiceUseCase.updateNom({
      codeService,
      nomService: dto.nomService,
    });
  }

  @Patch('services/:codeService/direction')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateServiceCodeDirection(
    @Param('codeService') codeService: string,
    @Body() dto: UpdateServiceCodeDirectionDto,
  ): Promise<void> {
    await this.updateServiceUseCase.updateCodeDirection({
      codeService,
      codeDirection: dto.codeDirection,
    });
  }
}
