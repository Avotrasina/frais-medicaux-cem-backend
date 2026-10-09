/*
  Warnings:

  - A unique constraint covering the columns `[ref_attestation]` on the table `attestations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ref_attestation` to the `attestations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pec"."attestations" ADD COLUMN     "ref_attestation" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "attestations_ref_attestation_key" ON "pec"."attestations"("ref_attestation");
