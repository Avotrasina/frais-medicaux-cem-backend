CREATE TYPE "pec"."TypeRegle" AS ENUM (
  'CHARGE_TOTALE_CEM',
  'REPARTITION_AGENT_CEM'
);

CREATE TYPE "pec"."AgentConcerne" AS ENUM ('ACTIF', 'NON_ACTIF');

CREATE TABLE "pec"."regle" (
  "id" SERIAL NOT NULL,
  "type" "pec"."TypeRegle" NOT NULL,
  "agentConcerne" "pec"."AgentConcerne" NOT NULL,
  "tauxCem" DECIMAL(5, 2) NOT NULL,
  "dateEffet" DATE NOT NULL,
  "dateFin" DATE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "regle_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "regle_agentConcerne_dateEffet_idx"
  ON "pec"."regle"("agentConcerne", "dateEffet");

ALTER TABLE "pec"."regle"
  ADD CONSTRAINT "regle_type_taux_cem_check"
  CHECK (
    ("type" = 'CHARGE_TOTALE_CEM' AND "tauxCem" = 100)
    OR
    (
      "type" = 'REPARTITION_AGENT_CEM'
      AND "tauxCem" > 0
      AND "tauxCem" < 100
    )
  );

ALTER TABLE "pec"."regle"
  ADD CONSTRAINT "regle_date_fin_check"
  CHECK ("dateFin" IS NULL OR "dateFin" >= "dateEffet");

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "pec"."regle"
  ADD CONSTRAINT "regle_agent_periode_excl"
  EXCLUDE USING gist (
    "agentConcerne" WITH =,
    daterange("dateEffet", "dateFin", '[]') WITH &&
  );
