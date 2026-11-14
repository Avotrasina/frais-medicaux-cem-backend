CREATE SCHEMA IF NOT EXISTS "acte";

CREATE TYPE "acte"."regime_acte" AS ENUM ('normal', 'exclu', 'sur_decision_dg');
CREATE TYPE "acte"."portee_plafond" AS ENUM ('par_acte', 'par_an');
CREATE TYPE "acte"."unite_plafond" AS ENUM ('montant', 'seances');

CREATE TABLE "acte"."categorie_actes" (
    "id" SERIAL NOT NULL,
    "nom_categorie" TEXT NOT NULL,

    CONSTRAINT "categorie_actes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "acte"."actes" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "nom_acte" TEXT NOT NULL,
    "liste_libelle" TEXT NOT NULL,
    "regime" "acte"."regime_acte" NOT NULL DEFAULT 'normal',
    "categorie_acte_id" INTEGER NOT NULL,

    CONSTRAINT "actes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "acte"."plafonds" (
    "id" SERIAL NOT NULL,
    "portee_plafond" "acte"."portee_plafond" NOT NULL DEFAULT 'par_acte',
    "unite" "acte"."unite_plafond" NOT NULL DEFAULT 'montant',
    "montant" DECIMAL(15,2),
    "nb_seances" INTEGER,
    "acte_id" INTEGER,
    "categorie_acte_id" INTEGER,

    CONSTRAINT "plafonds_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "plafonds_exactly_one_owner_check" CHECK (
        ("acte_id" IS NOT NULL AND "categorie_acte_id" IS NULL)
        OR ("acte_id" IS NULL AND "categorie_acte_id" IS NOT NULL)
    )
);

CREATE UNIQUE INDEX "categorie_actes_nom_categorie_key"
    ON "acte"."categorie_actes"("nom_categorie");
CREATE UNIQUE INDEX "actes_code_key" ON "acte"."actes"("code");
CREATE UNIQUE INDEX "plafonds_acte_id_portee_plafond_key"
    ON "acte"."plafonds"("acte_id", "portee_plafond");
CREATE UNIQUE INDEX "plafonds_categorie_acte_id_portee_plafond_key"
    ON "acte"."plafonds"("categorie_acte_id", "portee_plafond");

ALTER TABLE "acte"."actes"
    ADD CONSTRAINT "actes_categorie_acte_id_fkey"
    FOREIGN KEY ("categorie_acte_id")
    REFERENCES "acte"."categorie_actes"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "acte"."plafonds"
    ADD CONSTRAINT "plafonds_acte_id_fkey"
    FOREIGN KEY ("acte_id")
    REFERENCES "acte"."actes"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "acte"."plafonds"
    ADD CONSTRAINT "plafonds_categorie_acte_id_fkey"
    FOREIGN KEY ("categorie_acte_id")
    REFERENCES "acte"."categorie_actes"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
