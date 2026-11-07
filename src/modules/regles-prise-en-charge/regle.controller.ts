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
import type { Regle } from '../generated/prisma/client.js';
import { CreerRegleDto, ModifierRegleDto } from './dtos/regle.dto.js';
import { RegleService } from './regle.service.js';

interface Reponse<T> {
  message: string;
  donnees: T;
}

@Controller('regles-prise-en-charge')
export class RegleController {
  constructor(private readonly regleService: RegleService) {}

  @Post()
  async creer(@Body() donnees: CreerRegleDto): Promise<Reponse<Regle>> {
    return {
      message: 'La règle de prise en charge a été créée avec succès.',
      donnees: await this.regleService.creer(donnees),
    };
  }

  @Get()
  async lister(): Promise<Reponse<Regle[]>> {
    return {
      message: 'Les règles de prise en charge ont été récupérées avec succès.',
      donnees: await this.regleService.lister(),
    };
  }

  @Get(':id')
  async obtenirParId(
    @Param(
      'id',
      new ParseIntPipe({
        exceptionFactory: () =>
          new BadRequestException("L'identifiant de la règle doit être un entier positif."),
      }),
    )
    id: number,
  ): Promise<Reponse<Regle>> {
    return {
      message: 'La règle de prise en charge a été récupérée avec succès.',
      donnees: await this.regleService.obtenirParId(id),
    };
  }

  @Patch(':id')
  async modifier(
    @Param(
      'id',
      new ParseIntPipe({
        exceptionFactory: () =>
          new BadRequestException("L'identifiant de la règle doit être un entier positif."),
      }),
    )
    id: number,
    @Body() donnees: ModifierRegleDto,
  ): Promise<Reponse<Regle>> {
    return {
      message: 'La règle de prise en charge a été modifiée avec succès.',
      donnees: await this.regleService.modifier(id, donnees),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async supprimer(
    @Param(
      'id',
      new ParseIntPipe({
        exceptionFactory: () =>
          new BadRequestException("L'identifiant de la règle doit être un entier positif."),
      }),
    )
    id: number,
  ): Promise<Reponse<null>> {
    await this.regleService.supprimer(id);
    return {
      message: 'La règle de prise en charge a été supprimée avec succès.',
      donnees: null,
    };
  }
}
