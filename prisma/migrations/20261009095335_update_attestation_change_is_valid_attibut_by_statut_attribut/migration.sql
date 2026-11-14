/*
  Warnings:

  - You are about to drop the column `is_validate` on the `attestations` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "pec"."statut_attestation" AS ENUM ('en_attente', 'validee', 'refusee');

-- AlterTable
ALTER TABLE "pec"."attestations" DROP COLUMN "is_validate",
ADD COLUMN     "statut" "pec"."statut_attestation" NOT NULL DEFAULT 'en_attente';
