import {
  BadRequestException,
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
} from '@nestjs/common';
import { CreerRegleDto, ModifierRegleDto } from './dtos/regle.dto.js';
import { RegleService } from './regle.service.js';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import {
  RegleResponseEnveloppeDto,
  RegleResponseDto,
  ReglesResponseEnveloppeDto,
} from './dtos/regle-response.dto.js';
import type { Regle } from '../../generated/prisma/client.js';

@Controller('regles-prise-en-charge')
export class RegleController {
  constructor(private readonly regleService: RegleService) {}

  @Post()
  @ApiCreatedResponse({ type: RegleResponseEnveloppeDto })
  async creer(
    @Body() donnees: CreerRegleDto,
  ): Promise<RegleResponseEnveloppeDto> {
    return {
      message: 'La règle de prise en charge a été créée avec succès.',
      donnees: this.versDto(await this.regleService.creer(donnees)),
    };
  }

  @Get()
  @ApiOkResponse({ type: ReglesResponseEnveloppeDto })
  async lister(): Promise<ReglesResponseEnveloppeDto> {
    return {
      message: 'Les règles de prise en charge ont été récupérées avec succès.',
      donnees: (await this.regleService.lister()).map((regle) =>
        this.versDto(regle),
      ),
    };
  }

  @Get(':id')
  @ApiOkResponse({ type: RegleResponseEnveloppeDto })
  async obtenirParId(
    @Param(
      'id',
      new ParseIntPipe({
        exceptionFactory: () =>
          new BadRequestException(
            "L'identifiant de la règle doit être un entier positif.",
          ),
      }),
    )
    id: number,
  ): Promise<RegleResponseEnveloppeDto> {
    return {
      message: 'La règle de prise en charge a été récupérée avec succès.',
      donnees: this.versDto(await this.regleService.obtenirParId(id)),
    };
  }

  @Patch(':id')
  @ApiOkResponse({ type: RegleResponseEnveloppeDto })
  async modifier(
    @Param(
      'id',
      new ParseIntPipe({
        exceptionFactory: () =>
          new BadRequestException(
            "L'identifiant de la règle doit être un entier positif.",
          ),
      }),
    )
    id: number,
    @Body() donnees: ModifierRegleDto,
  ): Promise<RegleResponseEnveloppeDto> {
    return {
      message: 'La règle de prise en charge a été modifiée avec succès.',
      donnees: this.versDto(await this.regleService.modifier(id, donnees)),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: RegleResponseEnveloppeDto })
  async supprimer(
    @Param(
      'id',
      new ParseIntPipe({
        exceptionFactory: () =>
          new BadRequestException(
            "L'identifiant de la règle doit être un entier positif.",
          ),
      }),
    )
    id: number,
  ): Promise<RegleResponseEnveloppeDto> {
    await this.regleService.supprimer(id);
    return {
      message: 'La règle de prise en charge a été supprimée avec succès.',
      donnees: null,
    };
  }

  private versDto(regle: Regle): RegleResponseDto {
    return { ...regle, tauxCem: regle.tauxCem.toString() };
  }
}
