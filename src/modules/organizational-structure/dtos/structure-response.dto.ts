import { ApiProperty } from '@nestjs/swagger';
import type { ReadAgence } from '../types/agence.types.js';
import type { ReadDirectionWithServices } from '../types/direction.types.js';
import type { ReadService } from '../types/service.types.js';

export class AgenceResponseDto implements ReadAgence {
  @ApiProperty()
  codeAgence!: string;

  @ApiProperty()
  nomAgence!: string;
}

export class ServiceResponseDto implements ReadService {
  @ApiProperty()
  codeService!: string;

  @ApiProperty()
  nom!: string;

  @ApiProperty()
  codeDirection!: string;
}

class DirectionResponseDto {
  @ApiProperty()
  codeDirection!: string;

  @ApiProperty()
  nom!: string;
}

export class DirectionAvecServicesResponseDto
  extends DirectionResponseDto
  implements ReadDirectionWithServices
{
  @ApiProperty({ type: [ServiceResponseDto] })
  services!: ServiceResponseDto[];
}
