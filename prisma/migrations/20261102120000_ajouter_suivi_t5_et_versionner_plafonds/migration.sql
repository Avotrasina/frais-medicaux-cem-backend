ALTER TABLE "acte"."plafonds" ADD COLUMN "date_effet" DATE;
UPDATE "acte"."plafonds" SET "date_effet" = DATE '1900-01-01' WHERE "date_effet" IS NULL;
ALTER TABLE "acte"."plafonds" ALTER COLUMN "date_effet" SET NOT NULL;
ALTER TABLE "acte"."plafonds" ADD COLUMN "date_fin" DATE;

CREATE TABLE "facturation"."ligne_suivi" (
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
    CONSTRAINT "ligne_suivi_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ligne_suivi_beneficiaire_id_acte_id_date_acte_idx"
  ON "facturation"."ligne_suivi"("beneficiaire_id", "acte_id", "date_acte");
CREATE INDEX "ligne_suivi_facture_globale_id_idx"
  ON "facturation"."ligne_suivi"("facture_globale_id");

ALTER TABLE "facturation"."ligne_suivi"
  ADD CONSTRAINT "ligne_suivi_facture_globale_id_fkey"
  FOREIGN KEY ("facture_globale_id") REFERENCES "facturation"."facture_globale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "facturation"."ligne_suivi"
  ADD CONSTRAINT "ligne_suivi_beneficiaire_id_fkey"
  FOREIGN KEY ("beneficiaire_id") REFERENCES "pec"."beneficiaires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "facturation"."ligne_suivi"
  ADD CONSTRAINT "ligne_suivi_acte_id_fkey"
  FOREIGN KEY ("acte_id") REFERENCES "acte"."actes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "facturation"."ligne_suivi"
  ADD CONSTRAINT "ligne_suivi_saisi_par_id_fkey"
  FOREIGN KEY ("saisi_par_id") REFERENCES "facturation"."utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
