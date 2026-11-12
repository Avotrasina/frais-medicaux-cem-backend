import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaieEtatService } from './paie-etat.service.js';
import {
  ConsommationPaieResponseDto,
  EtatIndividuelPaieResponseDto,
  EtatPaieResponseDto,
  LignesPaiePagineesResponseDto,
  PaieMoisResponseDto,
} from '../../dtos/paie-response.dto.js';

@ApiTags('Paies')
@Controller('paies')
export class PaieEtatController {
  constructor(private readonly paieEtat: PaieEtatService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les mois de paie clôturés' })
  @ApiOkResponse({
    type: PaieMoisResponseDto,
    isArray: true,
    description: 'Mois clôturés, nombre de factures et lignes, total agent.',
  })
  listerPaies(): Promise<PaieMoisResponseDto[]> {
    return this.paieEtat.listerPaies();
  }

  @Get(':mois/lignes')
  @ApiOperation({ summary: 'Lister les lignes d’un mois de paie' })
  @ApiParam({ name: 'mois', example: '2026-03', description: 'Format AAAA-MM' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limite', required: false, example: 50, maximum: 200 })
  @ApiQuery({ name: 'im', required: false, example: 101 })
  @ApiQuery({ name: 'prestataireId', required: false, example: 12 })
  @ApiQuery({ name: 'factureId', required: false, example: 42 })
  @ApiQuery({ name: 'direction', required: false, example: 'DRH' })
  @ApiOkResponse({
    type: LignesPaiePagineesResponseDto,
    description: 'Lignes paginées et total.',
  })
  @ApiResponse({ status: 400, description: 'Mois ou pagination invalide.' })
  listerLignes(
    @Param('mois') mois: string,
    @Query('page') pageTexte?: string,
    @Query('limite') limiteTexte?: string,
    @Query('im') imTexte?: string,
    @Query('prestataireId') prestataireIdTexte?: string,
    @Query('factureId') factureIdTexte?: string,
    @Query('direction') direction?: string,
  ): Promise<LignesPaiePagineesResponseDto> {
    this.validerMois(mois);
    const page = this.entierPositif(pageTexte, 1, 'page');
    const limite = this.entierPositif(limiteTexte, 50, 'limite');
    if (limite > 200) {
      throw new BadRequestException('La limite ne peut pas dépasser 200.');
    }
    return this.paieEtat.listerLignes(
      mois,
      {
        im: this.entierPositifOptionnel(imTexte, 'im'),
        prestataireId: this.entierPositifOptionnel(
          prestataireIdTexte,
          'prestataireId',
        ),
        factureId: this.entierPositifOptionnel(factureIdTexte, 'factureId'),
        direction,
      },
      page,
      limite,
    );
  }

  @Get(':mois/consommation')
  @ApiOperation({
    summary: 'Consulter la consommation par agent et prestataire',
  })
  @ApiParam({ name: 'mois', example: '2026-03', description: 'Format AAAA-MM' })
  @ApiOkResponse({
    type: ConsommationPaieResponseDto,
    description: 'Consommation et total général.',
  })
  @ApiResponse({ status: 400, description: 'Mois invalide.' })
  consommation(
    @Param('mois') mois: string,
  ): Promise<ConsommationPaieResponseDto> {
    this.validerMois(mois);
    return this.paieEtat.consommation(mois);
  }

  @Get(':mois/etat')
  @ApiOperation({ summary: 'Consulter l’état mensuel de paie par agent' })
  @ApiParam({ name: 'mois', example: '2026-03', description: 'Format AAAA-MM' })
  @ApiOkResponse({
    type: EtatPaieResponseDto,
    description: 'État par agent et total général.',
  })
  @ApiResponse({ status: 400, description: 'Mois invalide.' })
  etat(@Param('mois') mois: string): Promise<EtatPaieResponseDto> {
    this.validerMois(mois);
    return this.paieEtat.etat(mois);
  }

  @Get(':mois/agents/:im')
  @ApiOperation({ summary: 'Consulter l’état individuel d’un agent' })
  @ApiParam({ name: 'mois', example: '2026-03', description: 'Format AAAA-MM' })
  @ApiParam({ name: 'im', example: 101, description: 'Matricule de l’agent' })
  @ApiOkResponse({
    type: EtatIndividuelPaieResponseDto,
    description: 'État individuel par établissement.',
  })
  @ApiResponse({ status: 400, description: 'Mois ou matricule invalide.' })
  @ApiResponse({ status: 404, description: 'Agent introuvable.' })
  etatIndividuel(
    @Param('mois') mois: string,
    @Param('im') imTexte: string,
  ): Promise<EtatIndividuelPaieResponseDto> {
    this.validerMois(mois);
    const im = this.entierPositifOptionnel(imTexte, 'im');
    if (im === undefined) {
      throw new BadRequestException(
        'Le matricule doit être un entier positif.',
      );
    }
    return this.paieEtat.etatIndividuel(mois, im);
  }

  private validerMois(mois: string): void {
    if (!/^(?!0000)\d{4}-(0[1-9]|1[0-2])$/.test(mois)) {
      throw new BadRequestException('Le mois doit être au format AAAA-MM.');
    }
  }

  private entierPositif(
    valeur: string | undefined,
    defaut: number,
    champ: string,
  ): number {
    return this.entierPositifOptionnel(valeur, champ) ?? defaut;
  }

  private entierPositifOptionnel(
    valeur: string | undefined,
    champ: string,
  ): number | undefined {
    if (valeur === undefined) return undefined;
    if (!/^[1-9]\d*$/.test(valeur)) {
      throw new BadRequestException(`${champ} doit être un entier positif.`);
    }
    const entier = Number(valeur);
    if (!Number.isSafeInteger(entier)) {
      throw new BadRequestException(`${champ} est hors limites.`);
    }
    return entier;
  }
}
