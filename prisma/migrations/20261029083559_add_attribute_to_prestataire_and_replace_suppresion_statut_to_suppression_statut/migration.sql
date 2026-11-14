/*
  Warnings:

  - The `suppressionStatut` column on the `personnes` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `suppressionStatut` column on the `attestations` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `suppressionStatut` column on the `beneficiaires` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `suppressionStatut` column on the `categories_prestataire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `suppressionStatut` column on the `lieux` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `suppressionStatut` column on the `prestataires` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `suppressionStatut` column on the `agences` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `suppressionStatut` column on the `agents` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `suppressionStatut` column on the `categories_agents` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `suppressionStatut` column on the `conjoints` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `suppressionStatut` column on the `directions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `suppressionStatut` column on the `enfants` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `suppressionStatut` column on the `famille_agents` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `suppressionStatut` column on the `services` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `suppressionStatut` column on the `structure_organisationnelle` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "identifiant"."suppression_statut" AS ENUM ('en_attente', 'rejete');

-- AlterTable
ALTER TABLE "identifiant"."personnes" DROP COLUMN "suppressionStatut",
ADD COLUMN     "suppressionStatut" "identifiant"."suppression_statut";

-- AlterTable
ALTER TABLE "pec"."attestations" DROP COLUMN "suppressionStatut",
ADD COLUMN     "suppressionStatut" "identifiant"."suppression_statut";

-- AlterTable
ALTER TABLE "pec"."beneficiaires" DROP COLUMN "suppressionStatut",
ADD COLUMN     "suppressionStatut" "identifiant"."suppression_statut";

-- AlterTable
ALTER TABLE "pec"."categories_prestataire" DROP COLUMN "suppressionStatut",
ADD COLUMN     "suppressionStatut" "identifiant"."suppression_statut";

-- AlterTable
ALTER TABLE "pec"."lieux" DROP COLUMN "suppressionStatut",
ADD COLUMN     "suppressionStatut" "identifiant"."suppression_statut";

-- AlterTable
ALTER TABLE "pec"."prestataires" ADD COLUMN     "echeance_renouvellement" TEXT,
ADD COLUMN     "echenace_resiliation" TEXT,
ADD COLUMN     "observation" TEXT,
DROP COLUMN "suppressionStatut",
ADD COLUMN     "suppressionStatut" "identifiant"."suppression_statut";

-- AlterTable
ALTER TABLE "personnel"."agences" DROP COLUMN "suppressionStatut",
ADD COLUMN     "suppressionStatut" "identifiant"."suppression_statut";

-- AlterTable
ALTER TABLE "personnel"."agents" DROP COLUMN "suppressionStatut",
ADD COLUMN     "suppressionStatut" "identifiant"."suppression_statut";

-- AlterTable
ALTER TABLE "personnel"."categories_agents" DROP COLUMN "suppressionStatut",
ADD COLUMN     "suppressionStatut" "identifiant"."suppression_statut";

-- AlterTable
ALTER TABLE "personnel"."conjoints" DROP COLUMN "suppressionStatut",
ADD COLUMN     "suppressionStatut" "identifiant"."suppression_statut";

-- AlterTable
ALTER TABLE "personnel"."directions" DROP COLUMN "suppressionStatut",
ADD COLUMN     "suppressionStatut" "identifiant"."suppression_statut";

-- AlterTable
ALTER TABLE "personnel"."enfants" DROP COLUMN "suppressionStatut",
ADD COLUMN     "suppressionStatut" "identifiant"."suppression_statut";

-- AlterTable
ALTER TABLE "personnel"."famille_agents" DROP COLUMN "suppressionStatut",
ADD COLUMN     "suppressionStatut" "identifiant"."suppression_statut";

-- AlterTable
ALTER TABLE "personnel"."services" DROP COLUMN "suppressionStatut",
ADD COLUMN     "suppressionStatut" "identifiant"."suppression_statut";

-- AlterTable
ALTER TABLE "personnel"."structure_organisationnelle" DROP COLUMN "suppressionStatut",
ADD COLUMN     "suppressionStatut" "identifiant"."suppression_statut";

-- DropEnum
DROP TYPE "identifiant"."suppresion_statut";
