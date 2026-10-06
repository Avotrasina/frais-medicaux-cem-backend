export interface ReadService {
  codeService: string;
  nom: string;
  codeDirection: string;
}

export interface CreateService {
  codeService: string;
  nom: string;
  codeDirection: string;
}

export type UpdateService = Partial<Omit<CreateService, "codeService">>;