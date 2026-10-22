-- CreateEnum
CREATE TYPE "identifiant"."suppresion_statut" AS ENUM ('en_attente', 'rejete');

-- AlterTable
ALTER TABLE "identifiant"."personnes" ADD COLUMN     "suppressionStatut" "identifiant"."suppresion_statut";

-- AlterTable
ALTER TABLE "pec"."attestations" ADD COLUMN     "suppressionStatut" "identifiant"."suppresion_statut";

-- AlterTable
ALTER TABLE "pec"."beneficiaires" ADD COLUMN     "suppressionStatut" "identifiant"."suppresion_statut";

-- AlterTable
ALTER TABLE "pec"."categories_prestataire" ADD COLUMN     "suppressionStatut" "identifiant"."suppresion_statut";

-- AlterTable
ALTER TABLE "pec"."lieux" ADD COLUMN     "suppressionStatut" "identifiant"."suppresion_statut";

-- AlterTable
ALTER TABLE "pec"."prestataires" ADD COLUMN     "suppressionStatut" "identifiant"."suppresion_statut";

-- AlterTable
ALTER TABLE "personnel"."agences" ADD COLUMN     "suppressionStatut" "identifiant"."suppresion_statut";

-- AlterTable
ALTER TABLE "personnel"."agents" ADD COLUMN     "suppressionStatut" "identifiant"."suppresion_statut";

-- AlterTable
ALTER TABLE "personnel"."categories_agents" ADD COLUMN     "suppressionStatut" "identifiant"."suppresion_statut";

-- AlterTable
ALTER TABLE "personnel"."conjoints" ADD COLUMN     "suppressionStatut" "identifiant"."suppresion_statut";

-- AlterTable
ALTER TABLE "personnel"."directions" ADD COLUMN     "suppressionStatut" "identifiant"."suppresion_statut";

-- AlterTable
ALTER TABLE "personnel"."enfants" ADD COLUMN     "suppressionStatut" "identifiant"."suppresion_statut";

-- AlterTable
ALTER TABLE "personnel"."famille_agents" ADD COLUMN     "suppressionStatut" "identifiant"."suppresion_statut";

-- AlterTable
ALTER TABLE "personnel"."services" ADD COLUMN     "suppressionStatut" "identifiant"."suppresion_statut";

-- AlterTable
ALTER TABLE "personnel"."structure_organisationnelle" ADD COLUMN     "suppressionStatut" "identifiant"."suppresion_statut";
