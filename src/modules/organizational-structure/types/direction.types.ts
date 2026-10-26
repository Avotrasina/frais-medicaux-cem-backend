import type { ReadService } from './service.types.js';

export type ReadDirection = {
  codeDirection: string;
  nom: string;
};

export type CreateDirection = ReadDirection;

export type UpdateDirection = Partial<Omit<CreateDirection, 'codeDirection'>>;

export type ReadDirectionWithServices = ReadDirection & {
  services: ReadService[];
};
