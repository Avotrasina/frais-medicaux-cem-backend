/*
  Warnings:

  - You are about to drop the column `ref_attestation` on the `attestations` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "pec"."attestations_ref_attestation_key";

-- AlterTable
ALTER TABLE "pec"."attestations" DROP COLUMN "ref_attestation",
ALTER COLUMN "attestation_path" DROP NOT NULL;
