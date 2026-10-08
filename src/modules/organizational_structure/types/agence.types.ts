export type ReadAgence = {
  codeAgence: string;
  nomAgence: string;
};

export type CreateAgence = ReadAgence;

export type UpdateAgence = Partial<Omit<CreateAgence, "codeAgence">>;