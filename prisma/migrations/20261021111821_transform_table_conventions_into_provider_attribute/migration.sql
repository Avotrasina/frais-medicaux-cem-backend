/*
  Warnings:

  - You are about to drop the `conventions` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `convention_path` to the `prestataires` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "pec"."conventions" DROP CONSTRAINT "conventions_id_prestataire_fkey";

-- AlterTable
ALTER TABLE "pec"."prestataires" ADD COLUMN     "convention_path" TEXT NOT NULL;

-- DropTable
DROP TABLE "pec"."conventions";
