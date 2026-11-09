import { ApiProperty } from '@nestjs/swagger';
import { AgentConcerne, TypeRegle } from '../../../generated/prisma/enums.js';

export class RegleResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ enum: TypeRegle })
  type!: TypeRegle;

  @ApiProperty({ enum: AgentConcerne })
  agentConcerne!: AgentConcerne;

  @ApiProperty({ type: String, example: '80.50' })
  tauxCem!: string;

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
