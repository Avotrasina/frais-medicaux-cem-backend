/*
  Warnings:

  - Added the required column `dt_pec` to the `attestations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pec"."attestations" ADD COLUMN     "dt_pec" TIMESTAMP(3) NOT NULL;
