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

@Controller('organizational-structures')
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

  @Delete('agencies/:code-agence')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestAgencyDeletion(@Param('code-agence') id: string): Promise<void> {
    await this.deleteStructureUseCase.request('agence', id);
  }

  @Post('agencies/:code-agence/deletion-validation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async validateAgencyDeletion(
    @Param('code-agence') id: string,
  ): Promise<void> {
    await this.deleteStructureUseCase.validate('agence', id);
  }

  @Post('agencies/:code-agence/deletion-rejection')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectAgencyDeletion(@Param('code-agence') id: string): Promise<void> {
    await this.deleteStructureUseCase.reject('agence', id);
  }

  @Delete('directions/:code-direction')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestDirectionDeletion(
    @Param('code-direction') id: string,
  ): Promise<void> {
    await this.deleteStructureUseCase.request('direction', id);
  }

  @Post('directions/:code-direction/deletion-validation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async validateDirectionDeletion(
    @Param('code-direction') id: string,
  ): Promise<void> {
    await this.deleteStructureUseCase.validate('direction', id);
  }

  @Post('directions/:code-direction/deletion-rejection')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectDirectionDeletion(
    @Param('code-direction') id: string,
  ): Promise<void> {
    await this.deleteStructureUseCase.reject('direction', id);
  }

  @Delete('services/:code-service')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestServiceDeletion(
    @Param('code-service') id: string,
  ): Promise<void> {
    await this.deleteStructureUseCase.request('service', id);
  }

  @Post('services/:code-service/deletion-validation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async validateServiceDeletion(
    @Param('code-service') id: string,
  ): Promise<void> {
    await this.deleteStructureUseCase.validate('service', id);
  }

  @Post('services/:code-service/deletion-rejection')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectServiceDeletion(
    @Param('code-service') id: string,
  ): Promise<void> {
    await this.deleteStructureUseCase.reject('service', id);
  }

  @Post('agencies')
  @HttpCode(HttpStatus.CREATED)
  async createAgency(@Body() dto: CreateAgenceDto): Promise<void> {
    await this.createAgenceUseCase.execute(dto);
  }

  @Get('agencies')
  async findAllAgencies(): Promise<ReadAgence[]> {
    return this.readAllAgencesUseCase.findAll();
  }

  @Get('agencies/deletion-requests')
  async findAgencyDeletionRequests(): Promise<ReadAgence[]> {
    return this.readAllAgencesUseCase.findDeletionRequests();
  }

  @Patch('agencies/:code-agence')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateAgence(
    @Param('code-agence') codeAgence: string,
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
  async findAllDirections(): Promise<ReadDirectionWithServices[]> {
    return this.readAllDirectionsUseCase.findAll();
  }

  @Get('directions/deletion-requests')
  async findDirectionDeletionRequests(): Promise<ReadDirectionWithServices[]> {
    return this.readAllDirectionsUseCase.findDeletionRequests();
  }

  @Patch('directions/:code-direction')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateDirection(
    @Param('code-direction') codeDirection: string,
    @Body() dto: UpdateDirectionDto,
  ): Promise<void> {
    await this.updateDirectionUseCase.execute({
      codeDirection,
      nomDirection: dto.nomDirection,
    });
  }

  @Get('directions/:code-direction/services')
  async findServicesByDirection(
    @Param('code-direction') codeDirection: string,
  ): Promise<ReadService[]> {
    return this.readServiceUseCase.findByDirection({ codeDirection });
  }

  @Post('services')
  @HttpCode(HttpStatus.CREATED)
  async createService(@Body() dto: CreateServiceDto): Promise<void> {
    await this.createServiceUseCase.execute(dto);
  }

  @Get('services')
  async findAllServices(): Promise<ReadService[]> {
    return this.readServiceUseCase.findAll();
  }

  @Get('services/deletion-requests')
  async findServiceDeletionRequests(): Promise<ReadService[]> {
    return this.readServiceUseCase.findDeletionRequests();
  }

  @Patch('services/:code-service/name')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateServiceNom(
    @Param('code-service') codeService: string,
    @Body() dto: UpdateServiceNomDto,
  ): Promise<void> {
    await this.updateServiceUseCase.updateNom({
      codeService,
      nomService: dto.nomService,
    });
  }

  @Patch('services/:code-service/direction')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateServiceCodeDirection(
    @Param('code-service') codeService: string,
    @Body() dto: UpdateServiceCodeDirectionDto,
  ): Promise<void> {
    await this.updateServiceUseCase.updateCodeDirection({
      codeService,
      codeDirection: dto.codeDirection,
    });
  }
}
