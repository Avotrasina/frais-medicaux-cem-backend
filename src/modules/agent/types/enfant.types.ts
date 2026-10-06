export type ReadEnfant = {
  id: number;
  numEnfant: number;
};

export type CreateEnfant = {
  id: number;
  numEnfant: number;
};

export type UpdateEnfant = Partial<Omit<CreateEnfant, "id">>;