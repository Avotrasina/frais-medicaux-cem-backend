import type { CodeFamille } from "../../beneficiary/types/idp.types.js";

export const StatutAttestation = {
  EN_ATTENTE: "EN_ATTENTE",
  VALIDEE: "VALIDEE",
  REFUSEE: "REFUSEE",
} as const;
export type StatutAttestation =
  (typeof StatutAttestation)[keyof typeof StatutAttestation];

export const BackOfficeFrontOffice = {
  RETRAITE:"RETRAITE",
  DIRECTION:"DIRECTION",
  AGENCE:"AGENCE"
} as const;
export type BackOfficeFrontOffice = (typeof BackOfficeFrontOffice)[keyof typeof BackOfficeFrontOffice]

export type DecisionAttestation = Extract<
  StatutAttestation,
  "VALIDEE" | "REFUSEE"
>;

export type CreateAttestation = {
  attestationPath: string | null;
  naturePrestation: string;
  servicePrestataire?: string | null;
  providerID: number;
  idpBeneficiaire: string;
  datePEC:Date;
};

export type UpdatePartialAttestation = {
  attestationPath?: string | null;
  naturePrestation?: string | null;
  servicePrestataire?: string | null;
  prestataireID?: number | null;
  idpBenificiaire?:string|null;
  datePEC?: Date | null;
};

export type ReadAttestation = {
  id: number;
  attestationPath: string | null;
  dateValidation: Date | null;
  naturePrestation: string;
  servicePrestataire: string | null;
  statut: StatutAttestation;
  prestataireID: number;
  idpBeneficiaire: string;
  datePEC: Date;
};


export type FamilleData = {
    sexe: string;
    nom: string;
    prenom: string;
    dateNaissance :Date
}

export type AgentData = {
    sexe: string;
    nom: string;
    prenom: string;
    matricule: number;
    statusPEC: string;
    backofficefrontoffice: BackOfficeFrontOffice;
    nomFonction: string | null;
    nomDirection:string | null;
    nomAgence: string | null;
    acte: string; 
    service_prestataire?: string | null;
    nomEtablissement: string;
    localite: string;
}

export type AttestationData = {
  reference: string;
  image: string | null;
  codeFamille: CodeFamille; 
  famille:FamilleData | null;
  agent:AgentData;
  idp:string;
  datePEC:Date;
}
