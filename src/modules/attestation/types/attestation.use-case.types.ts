import {
  CreateAttestation,
  UpdatePartialAttestation,
} from './attestation.types.js';

export type CreateAttestationUseCaseType = Omit<
  CreateAttestation,
  'attestationPath'
>;
export type UpdateAttestationUseCaseType = Omit<
  UpdatePartialAttestation,
  'attestationPath'
>;
