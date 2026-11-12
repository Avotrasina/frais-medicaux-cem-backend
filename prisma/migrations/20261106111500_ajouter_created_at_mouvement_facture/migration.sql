ALTER TABLE "facturation"."mouvement_facture"
  ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "facturation"."mouvement_facture"
SET "created_at" = "date";
