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
import { DeleteOrganizationalStructureUseCase } from './use-cases/structure.delete.js';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  AgenceResponseDto,
  DirectionAvecServicesResponseDto,
  ServiceResponseDto,
} from './dtos/structure-response.dto.js';

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
  @ApiNoContentResponse({ description: 'Demande de suppression enregistrée.' })
  async requestAgencyDeletion(@Param('code-agence') id: string): Promise<void> {
    await this.deleteStructureUseCase.request('agence', id);
  }

  @Post('agencies/:code-agence/deletion-validation')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Suppression validée.' })
  async validateAgencyDeletion(
    @Param('code-agence') id: string,
  ): Promise<void> {
    await this.deleteStructureUseCase.validate('agence', id);
  }

  @Post('agencies/:code-agence/deletion-rejection')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Demande de suppression rejetée.' })
  async rejectAgencyDeletion(@Param('code-agence') id: string): Promise<void> {
    await this.deleteStructureUseCase.reject('agence', id);
  }

  @Delete('directions/:code-direction')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Demande de suppression enregistrée.' })
  async requestDirectionDeletion(
    @Param('code-direction') id: string,
  ): Promise<void> {
    await this.deleteStructureUseCase.request('direction', id);
  }

  @Post('directions/:code-direction/deletion-validation')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Suppression validée.' })
  async validateDirectionDeletion(
    @Param('code-direction') id: string,
  ): Promise<void> {
    await this.deleteStructureUseCase.validate('direction', id);
  }

  @Post('directions/:code-direction/deletion-rejection')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Demande de suppression rejetée.' })
  async rejectDirectionDeletion(
    @Param('code-direction') id: string,
  ): Promise<void> {
    await this.deleteStructureUseCase.reject('direction', id);
  }

  @Delete('services/:code-service')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Demande de suppression enregistrée.' })
  async requestServiceDeletion(
    @Param('code-service') id: string,
  ): Promise<void> {
    await this.deleteStructureUseCase.request('service', id);
  }

  @Post('services/:code-service/deletion-validation')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Suppression validée.' })
  async validateServiceDeletion(
    @Param('code-service') id: string,
  ): Promise<void> {
    await this.deleteStructureUseCase.validate('service', id);
  }

  @Post('services/:code-service/deletion-rejection')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Demande de suppression rejetée.' })
  async rejectServiceDeletion(
    @Param('code-service') id: string,
  ): Promise<void> {
    await this.deleteStructureUseCase.reject('service', id);
  }

  @Post('agencies')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Agence créée.' })
  async createAgency(@Body() dto: CreateAgenceDto): Promise<void> {
    await this.createAgenceUseCase.execute(dto);
  }

  @Get('agencies')
  @ApiOkResponse({ type: AgenceResponseDto, isArray: true })
  async findAllAgencies(): Promise<AgenceResponseDto[]> {
    return this.readAllAgencesUseCase.findAll();
  }

  @Get('agencies/deletion-requests')
  @ApiOkResponse({ type: AgenceResponseDto, isArray: true })
  async findAgencyDeletionRequests(): Promise<AgenceResponseDto[]> {
    return this.readAllAgencesUseCase.findDeletionRequests();
  }

  @Patch('agencies/:code-agence')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Agence mise à jour.' })
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
  @ApiCreatedResponse({ description: 'Direction créée.' })
  async createDirection(@Body() dto: CreateDirectionDto): Promise<void> {
    await this.createDirectionUseCase.execute(dto);
  }

  @Get('directions')
  @ApiOkResponse({ type: DirectionAvecServicesResponseDto, isArray: true })
  async findAllDirections(): Promise<DirectionAvecServicesResponseDto[]> {
    return this.readAllDirectionsUseCase.findAll();
  }

  @Get('directions/deletion-requests')
  @ApiOkResponse({ type: DirectionAvecServicesResponseDto, isArray: true })
  async findDirectionDeletionRequests(): Promise<
    DirectionAvecServicesResponseDto[]
  > {
    return this.readAllDirectionsUseCase.findDeletionRequests();
  }

  @Patch('directions/:code-direction')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Direction mise à jour.' })
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
  @ApiOkResponse({ type: ServiceResponseDto, isArray: true })
  async findServicesByDirection(
    @Param('code-direction') codeDirection: string,
  ): Promise<ServiceResponseDto[]> {
    return this.readServiceUseCase.findByDirection({ codeDirection });
  }

  @Post('services')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Service créé.' })
  async createService(@Body() dto: CreateServiceDto): Promise<void> {
    await this.createServiceUseCase.execute(dto);
  }

  @Get('services')
  @ApiOkResponse({ type: ServiceResponseDto, isArray: true })
  async findAllServices(): Promise<ServiceResponseDto[]> {
    return this.readServiceUseCase.findAll();
  }

  @Get('services/deletion-requests')
  @ApiOkResponse({ type: ServiceResponseDto, isArray: true })
  async findServiceDeletionRequests(): Promise<ServiceResponseDto[]> {
    return this.readServiceUseCase.findDeletionRequests();
  }

  @Patch('services/:code-service/name')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Nom du service mis à jour.' })
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
  @ApiNoContentResponse({ description: 'Direction du service mise à jour.' })
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
