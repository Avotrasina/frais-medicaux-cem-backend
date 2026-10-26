export const BackOfficeFrontOffice = {
  RETRAITE: 'RETRAITE',
  AGENCE: 'AGENCE',
  DIRECTION: 'DIRECTION',
} as const;

export type BackOfficeFrontOffice =
  (typeof BackOfficeFrontOffice)[keyof typeof BackOfficeFrontOffice];
