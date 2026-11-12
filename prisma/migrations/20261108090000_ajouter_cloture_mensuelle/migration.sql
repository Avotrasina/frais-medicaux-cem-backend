ALTER TABLE "facturation"."facture_globale"
  ADD COLUMN "mois_paie" DATE,
  ADD COLUMN "date_cloture" DATE;

CREATE INDEX "facture_globale_mois_paie_idx"
  ON "facturation"."facture_globale" ("mois_paie");

CREATE INDEX "facture_individuelle_mois_affectation_idx"
  ON "facturation"."facture_individuelle" ("mois_affectation");

ALTER TYPE "facturation"."type_mouvement" ADD VALUE IF NOT EXISTS 'cloture';
