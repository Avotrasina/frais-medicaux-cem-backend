DO $$
DECLARE
  table_presente BOOLEAN;
  lignes_presentes BOOLEAN;
BEGIN
  SELECT to_regclass('"facturation"."retenue_salaire"') IS NOT NULL
  INTO table_presente;

  IF table_presente THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM "facturation"."retenue_salaire")'
    INTO lignes_presentes;

    IF lignes_presentes THEN
      RAISE EXCEPTION 'La migration T6 est arrêtée : facturation.retenue_salaire contient des données.';
    END IF;
  END IF;
END $$;

ALTER TABLE "facturation"."facture_individuelle"
  DROP CONSTRAINT IF EXISTS "facture_individuelle_retenue_salaire_id_fkey",
  DROP COLUMN IF EXISTS "retenue_salaire_id",
  ADD COLUMN "ref_paie" TEXT,
  ADD COLUMN "mois_affectation" DATE;

DROP INDEX IF EXISTS "facturation"."facture_individuelle_retenue_salaire_id_idx";
DROP TABLE IF EXISTS "facturation"."retenue_salaire";
