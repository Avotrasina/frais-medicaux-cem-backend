ALTER TABLE "facturation"."piece_jointe_facture"
  ADD COLUMN "taille_octets" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "ajoute_par_id" INTEGER;

CREATE INDEX "piece_jointe_facture_ajoute_par_id_idx"
  ON "facturation"."piece_jointe_facture"("ajoute_par_id");

ALTER TABLE "facturation"."piece_jointe_facture"
  ADD CONSTRAINT "piece_jointe_facture_ajoute_par_id_fkey"
  FOREIGN KEY ("ajoute_par_id")
  REFERENCES "utilisateur"."utilisateur"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
