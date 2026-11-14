CREATE EXTENSION IF NOT EXISTS btree_gist;

DROP INDEX IF EXISTS "acte"."plafonds_acte_id_portee_plafond_key";
DROP INDEX IF EXISTS "acte"."plafonds_categorie_acte_id_portee_plafond_key";

ALTER TABLE "acte"."plafonds"
  DROP CONSTRAINT IF EXISTS "plafonds_exactly_one_owner_check",
  ADD CONSTRAINT "plafonds_exactly_one_owner_check"
    CHECK (num_nonnulls("acte_id", "categorie_acte_id") = 1),
  ADD CONSTRAINT "plafonds_date_range_check"
    CHECK ("date_fin" IS NULL OR "date_fin" >= "date_effet"),
  ADD CONSTRAINT "plafonds_unit_value_check"
    CHECK (
      ("unite" = 'montant' AND "montant" IS NOT NULL AND "montant" >= 0 AND "nb_seances" IS NULL)
      OR
      ("unite" = 'seances' AND "nb_seances" > 0 AND "montant" IS NULL)
    ),
  ADD CONSTRAINT "plafonds_par_acte_montant_check"
    CHECK ("portee_plafond" <> 'par_acte' OR "unite" = 'montant');

ALTER TABLE "acte"."plafonds"
  ADD CONSTRAINT "plafonds_acte_version_no_overlap"
    EXCLUDE USING gist (
      "acte_id" WITH =,
      "portee_plafond" WITH =,
      daterange("date_effet", "date_fin", '[]') WITH &&
    ) WHERE ("acte_id" IS NOT NULL),
  ADD CONSTRAINT "plafonds_categorie_version_no_overlap"
    EXCLUDE USING gist (
      "categorie_acte_id" WITH =,
      "portee_plafond" WITH =,
      daterange("date_effet", "date_fin", '[]') WITH &&
    ) WHERE ("categorie_acte_id" IS NOT NULL);

CREATE INDEX "plafonds_acte_id_portee_plafond_date_effet_idx"
  ON "acte"."plafonds"("acte_id", "portee_plafond", "date_effet");
CREATE INDEX "plafonds_categorie_acte_id_portee_plafond_date_effet_idx"
  ON "acte"."plafonds"("categorie_acte_id", "portee_plafond", "date_effet");
