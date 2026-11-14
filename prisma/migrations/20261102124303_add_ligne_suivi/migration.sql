/*
  Warnings:

  - You are about to drop the `ligne_suivi` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "facturation"."ligne_suivi" DROP CONSTRAINT "ligne_suivi_acte_id_fkey";

-- DropForeignKey
ALTER TABLE "facturation"."ligne_suivi" DROP CONSTRAINT "ligne_suivi_beneficiaire_id_fkey";

-- DropForeignKey
ALTER TABLE "facturation"."ligne_suivi" DROP CONSTRAINT "ligne_suivi_facture_globale_id_fkey";

-- DropForeignKey
ALTER TABLE "facturation"."ligne_suivi" DROP CONSTRAINT "ligne_suivi_saisi_par_id_fkey";

-- DropTable
DROP TABLE "facturation"."ligne_suivi";

-- CreateTable
CREATE TABLE "facturation"."LigneSuivi" (
    "id" SERIAL NOT NULL,
    "facture_globale_id" INTEGER NOT NULL,
    "beneficiaire_id" INTEGER NOT NULL,
    "acte_id" INTEGER NOT NULL,
    "date_acte" DATE NOT NULL,
    "libelle" TEXT NOT NULL,
    "montant_acte" DECIMAL(15,2) NOT NULL,
    "saisi_par_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LigneSuivi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LigneSuivi_beneficiaire_id_acte_id_date_acte_idx" ON "facturation"."LigneSuivi"("beneficiaire_id", "acte_id", "date_acte");

-- CreateIndex
CREATE INDEX "LigneSuivi_facture_globale_id_idx" ON "facturation"."LigneSuivi"("facture_globale_id");

-- AddForeignKey
ALTER TABLE "facturation"."LigneSuivi" ADD CONSTRAINT "LigneSuivi_facture_globale_id_fkey" FOREIGN KEY ("facture_globale_id") REFERENCES "facturation"."facture_globale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturation"."LigneSuivi" ADD CONSTRAINT "LigneSuivi_beneficiaire_id_fkey" FOREIGN KEY ("beneficiaire_id") REFERENCES "pec"."beneficiaires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturation"."LigneSuivi" ADD CONSTRAINT "LigneSuivi_acte_id_fkey" FOREIGN KEY ("acte_id") REFERENCES "acte"."actes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturation"."LigneSuivi" ADD CONSTRAINT "LigneSuivi_saisi_par_id_fkey" FOREIGN KEY ("saisi_par_id") REFERENCES "facturation"."utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
