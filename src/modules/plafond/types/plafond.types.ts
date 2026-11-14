import type {
  PorteePlafond,
  UnitePlafond,
} from '../../../generated/prisma/enums.js';

export type CreatePlafond = {
  dateEffet?: string;
  porteePlafond?: PorteePlafond;
  unite?: UnitePlafond;
  montant?: number | null;
  nbSeances?: number | null;
  acteID?: number | null;
  categorieActeID?: number | null;
};

export type UpdatePlafond = Partial<CreatePlafond> & {
  dateFin?: string | null;
};

export type ReadPlafond = {
  dateEffet: string;
  dateFin: string | null;
  id: number;
  porteePlafond: PorteePlafond;
  unite: UnitePlafond;
  montant: string | null;
  nbSeances: number | null;
  acteID: number | null;
  categorieActeID: number | null;
};
