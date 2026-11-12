-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "facturation";

-- CreateEnum
CREATE TYPE "facturation"."statut_facture" AS ENUM ('enregistree', 'en_validation', 'retournee', 'validee', 'sortie', 'annulee');

-- CreateEnum
CREATE TYPE "facturation"."type_mouvement" AS ENUM ('enregistrement', 'envoi_validation', 'retour_pour_correction', 'retour_prestataire', 'reception_apres_modification', 'validation', 'sortie', 'annulation');

-- CreateEnum
CREATE TYPE "facturation"."service_sortie" AS ENUM ('authentification', 'controle');

-- CreateEnum
CREATE TYPE "facturation"."motif_decision" AS ENUM ('decision_dg', 'exclusion_apres_etude', 'autre');

-- CreateEnum
CREATE TYPE "facturation"."role_utilisateur" AS ENUM ('operateur', 'adjoint', 'chef');

-- CreateTable
CREATE TABLE "facturation"."compteur_ref_sociale" (
    "annee" INTEGER NOT NULL,
    "dernier_numero" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "compteur_ref_sociale_pkey" PRIMARY KEY ("annee")
);

-- CreateTable
CREATE TABLE "facturation"."decision_prise_en_charge" (
    "id" SERIAL NOT NULL,
    "facture_individuelle_id" INTEGER NOT NULL,
    "montant_retenu" DECIMAL(15,2) NOT NULL,
    "taux_cem" DECIMAL(5,2),
    "motif" "facturation"."motif_decision" NOT NULL,
    "commentaire" TEXT,
    "decide_par" TEXT NOT NULL,
    "date_decision" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_prise_en_charge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturation"."facture_globale" (
    "id" SERIAL NOT NULL,
    "ref_sociale" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "date_reception" DATE NOT NULL,
    "num_facture" TEXT NOT NULL,
    "date_facture" DATE NOT NULL,
    "mois_prestation" DATE NOT NULL,
    "ref_agence" TEXT,
    "remarque" TEXT,
    "montant_total" DECIMAL(15,2) NOT NULL,
    "total_100_cem" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_depassement" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taux_cem" DECIMAL(5,2) NOT NULL,
    "statut" "facturation"."statut_facture" NOT NULL DEFAULT 'enregistree',
    "date_validation" TIMESTAMP(3),
    "prestataire_id" INTEGER NOT NULL,
    "enregistre_par_id" INTEGER NOT NULL,
    "valide_par_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facture_globale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturation"."facture_individuelle" (
    "id" SERIAL NOT NULL,
    "facture_globale_id" INTEGER NOT NULL,
    "num_ligne" INTEGER NOT NULL,
    "libelle" TEXT NOT NULL,
    "date_acte" DATE NOT NULL,
    "acte_id" INTEGER NOT NULL,
    "beneficiaire_id" INTEGER NOT NULL,
    "prise_en_charge_id" INTEGER,
    "montant_acte" DECIMAL(15,2) NOT NULL,
    "montant_cem_integral" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "montant_depassement_acte" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "montant_depassement_plafond" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "observation_depassement" TEXT,
    "taux_cem" DECIMAL(5,2) NOT NULL,
    "retenue_salaire_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facture_individuelle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturation"."mouvement_facture" (
    "id" SERIAL NOT NULL,
    "facture_globale_id" INTEGER NOT NULL,
    "type" "facturation"."type_mouvement" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarque" TEXT,
    "service" "facturation"."service_sortie",
    "effectue_par_id" INTEGER NOT NULL,
    "adresse_a_id" INTEGER,

    CONSTRAINT "mouvement_facture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturation"."piece_jointe_facture" (
    "id" SERIAL NOT NULL,
    "facture_globale_id" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "nom_fichier" TEXT,
    "type_fichier" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "piece_jointe_facture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturation"."retenue_salaire" (
    "id" SERIAL NOT NULL,
    "ref_paie" TEXT NOT NULL,
    "mois_affectation" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retenue_salaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturation"."utilisateur" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "role" "facturation"."role_utilisateur" NOT NULL,

    CONSTRAINT "utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "decision_prise_en_charge_facture_individuelle_id_key" ON "facturation"."decision_prise_en_charge"("facture_individuelle_id");

-- CreateIndex
CREATE UNIQUE INDEX "facture_globale_ref_sociale_key" ON "facturation"."facture_globale"("ref_sociale");

-- CreateIndex
CREATE INDEX "facture_globale_prestataire_id_num_facture_idx" ON "facturation"."facture_globale"("prestataire_id", "num_facture");

-- CreateIndex
CREATE INDEX "facture_globale_statut_idx" ON "facturation"."facture_globale"("statut");

-- CreateIndex
CREATE INDEX "facture_globale_date_reception_idx" ON "facturation"."facture_globale"("date_reception");

-- CreateIndex
CREATE INDEX "facture_globale_mois_prestation_idx" ON "facturation"."facture_globale"("mois_prestation");

-- CreateIndex
CREATE INDEX "facture_individuelle_beneficiaire_id_acte_id_date_acte_idx" ON "facturation"."facture_individuelle"("beneficiaire_id", "acte_id", "date_acte");

-- CreateIndex
CREATE INDEX "facture_individuelle_prise_en_charge_id_idx" ON "facturation"."facture_individuelle"("prise_en_charge_id");

-- CreateIndex
CREATE INDEX "facture_individuelle_retenue_salaire_id_idx" ON "facturation"."facture_individuelle"("retenue_salaire_id");

-- CreateIndex
CREATE UNIQUE INDEX "facture_individuelle_facture_globale_id_num_ligne_key" ON "facturation"."facture_individuelle"("facture_globale_id", "num_ligne");

-- CreateIndex
CREATE INDEX "mouvement_facture_facture_globale_id_date_idx" ON "facturation"."mouvement_facture"("facture_globale_id", "date");

-- CreateIndex
CREATE INDEX "piece_jointe_facture_facture_globale_id_idx" ON "facturation"."piece_jointe_facture"("facture_globale_id");

-- CreateIndex
CREATE INDEX "retenue_salaire_ref_paie_idx" ON "facturation"."retenue_salaire"("ref_paie");

-- CreateIndex
CREATE INDEX "retenue_salaire_mois_affectation_idx" ON "facturation"."retenue_salaire"("mois_affectation");

-- AddForeignKey
ALTER TABLE "facturation"."decision_prise_en_charge" ADD CONSTRAINT "decision_prise_en_charge_facture_individuelle_id_fkey" FOREIGN KEY ("facture_individuelle_id") REFERENCES "facturation"."facture_individuelle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturation"."facture_globale" ADD CONSTRAINT "facture_globale_prestataire_id_fkey" FOREIGN KEY ("prestataire_id") REFERENCES "pec"."prestataires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturation"."facture_globale" ADD CONSTRAINT "facture_globale_enregistre_par_id_fkey" FOREIGN KEY ("enregistre_par_id") REFERENCES "facturation"."utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturation"."facture_globale" ADD CONSTRAINT "facture_globale_valide_par_id_fkey" FOREIGN KEY ("valide_par_id") REFERENCES "facturation"."utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturation"."facture_individuelle" ADD CONSTRAINT "facture_individuelle_facture_globale_id_fkey" FOREIGN KEY ("facture_globale_id") REFERENCES "facturation"."facture_globale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturation"."facture_individuelle" ADD CONSTRAINT "facture_individuelle_acte_id_fkey" FOREIGN KEY ("acte_id") REFERENCES "acte"."actes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturation"."facture_individuelle" ADD CONSTRAINT "facture_individuelle_beneficiaire_id_fkey" FOREIGN KEY ("beneficiaire_id") REFERENCES "pec"."beneficiaires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturation"."facture_individuelle" ADD CONSTRAINT "facture_individuelle_retenue_salaire_id_fkey" FOREIGN KEY ("retenue_salaire_id") REFERENCES "facturation"."retenue_salaire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturation"."mouvement_facture" ADD CONSTRAINT "mouvement_facture_facture_globale_id_fkey" FOREIGN KEY ("facture_globale_id") REFERENCES "facturation"."facture_globale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturation"."mouvement_facture" ADD CONSTRAINT "mouvement_facture_effectue_par_id_fkey" FOREIGN KEY ("effectue_par_id") REFERENCES "facturation"."utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturation"."mouvement_facture" ADD CONSTRAINT "mouvement_facture_adresse_a_id_fkey" FOREIGN KEY ("adresse_a_id") REFERENCES "facturation"."utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturation"."piece_jointe_facture" ADD CONSTRAINT "piece_jointe_facture_facture_globale_id_fkey" FOREIGN KEY ("facture_globale_id") REFERENCES "facturation"."facture_globale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
