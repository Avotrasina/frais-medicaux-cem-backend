/*
  Warnings:

  - You are about to drop the column `direction_type` on the `directions` table. All the data in the column will be lost.
  - You are about to drop the column `status_pec` on the `structure_organisationnelle` table. All the data in the column will be lost.
  - Added the required column `statut_pec` to the `structure_organisationnelle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "personnel"."directions" DROP COLUMN "direction_type";

-- AlterTable
ALTER TABLE "personnel"."structure_organisationnelle" DROP COLUMN "status_pec",
ADD COLUMN     "statut_pec" "personnel"."status_pec" NOT NULL;

-- DropEnum
DROP TYPE "personnel"."direction_type";
