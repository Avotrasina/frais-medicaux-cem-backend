export type ReadConjoint = {
  id: number;
  numConjoint: number;
};

export type CreateConjoint = {
  id: number;
  numConjoint: number;
};

export type UpdateConjoint = Partial<Omit<CreateConjoint, "id">>;