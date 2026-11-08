import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '../../../generated/prisma/client.js';
import { AgentConcerne, TypeRegle } from '../../../generated/prisma/enums.js';
import type { Regle } from '../../../generated/prisma/client.js';

export class RegleResponseDto implements Regle {
  @ApiProperty()
  id!: number;

  @ApiProperty({ enum: TypeRegle })
  type!: TypeRegle;

  @ApiProperty({ enum: AgentConcerne })
  agentConcerne!: AgentConcerne;

  @ApiProperty({ type: String, example: '80.50' })
  tauxCem!: Prisma.Decimal;

  @ApiProperty({ type: String, format: 'date-time' })
  dateEffet!: Date;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  dateFin!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

export class RegleResponseEnveloppeDto {
  @ApiProperty()
  message!: string;

  @ApiProperty({ type: RegleResponseDto, nullable: true })
  donnees!: RegleResponseDto | null;
}

export class ReglesResponseEnveloppeDto {
  @ApiProperty()
  message!: string;

  @ApiProperty({ type: [RegleResponseDto] })
  donnees!: RegleResponseDto[];
}
