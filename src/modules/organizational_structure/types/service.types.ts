export type ReadService = {
  codeService: string;
  nom: string;
  codeDirection: string;
};

export type CreateService = ReadService;

export type UpdateService = Partial<Omit<CreateService, "codeService">>;