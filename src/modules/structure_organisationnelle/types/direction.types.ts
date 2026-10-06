export interface ReadDirection {
  codeDirection: string;
  nom: string;
}

export interface CreateDirection {
  codeDirection: string;
  nom: string;
}

export type UpdateDirection = Partial<Omit<CreateDirection, "codeDirection">>;