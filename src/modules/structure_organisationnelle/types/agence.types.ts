export interface ReadAgence {
  codeAgence: string;
  nomAgence: string;
}

export interface CreateAgence {
  codeAgence: string;
  nomAgence: string;
}

export type UpdateAgence = Partial<Omit<CreateAgence, "codeAgence">>;