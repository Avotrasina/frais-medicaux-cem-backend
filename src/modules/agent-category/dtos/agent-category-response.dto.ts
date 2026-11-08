import { ApiProperty } from '@nestjs/swagger';
import type { ReadAgentCategory } from '../types/agent-category.types.js';

export class AgentCategoryResponseDto implements ReadAgentCategory {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  codeCategory!: string;
}
