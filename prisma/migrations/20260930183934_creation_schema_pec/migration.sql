-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "identifiant";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "pec";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "personnel";

-- CreateEnum
CREATE TYPE "identifiant"."sexe" AS ENUM ('masculin', 'feminin');

-- CreateEnum
CREATE TYPE "personnel"."agent_type" AS ENUM ('agent_actif', 'agent_retraite');

-- CreateEnum
CREATE TYPE "personnel"."direction_type" AS ENUM ('service', 'libre');

-- CreateEnum
CREATE TYPE "personnel"."status_pec" AS ENUM ('agent', 'chef_service', 'chef_agence', 'directeur');

-- CreateEnum
CREATE TYPE "personnel"."structure_organisationnelle_type" AS ENUM ('agence', 'direction');

-- CreateEnum
CREATE TYPE "pec"."statut_prestataire" AS ENUM ('privee', 'public');

-- CreateTable
CREATE TABLE "identifiant"."personnes" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(25) NOT NULL,
    "prenom" VARCHAR(100) NOT NULL,
    "dt_naissance" TIMESTAMP(3) NOT NULL,
    "sexe" "identifiant"."sexe" NOT NULL,

    CONSTRAINT "personnes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel"."agents" (
    "id" INTEGER NOT NULL,
    "matricule" TEXT NOT NULL,
    "observation_matricule" TEXT,
    "carte_professionnelle_path" VARCHAR(50) NOT NULL,
    "dt_entree" TIMESTAMP(3) NOT NULL,
    "agent_type" "personnel"."agent_type" NOT NULL DEFAULT 'agent_actif',
    "structure_orga_id" TEXT,
    "code_service" TEXT,
    "fonction_id" INTEGER,
    "categorie_id" TEXT,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel"."fonctions" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "fonctions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel"."categories_agents" (
    "id" SERIAL NOT NULL,
    "code_category" TEXT NOT NULL,

    CONSTRAINT "categories_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel"."directions" (
    "code_direction" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "direction_type" "personnel"."direction_type" NOT NULL,

    CONSTRAINT "directions_pkey" PRIMARY KEY ("code_direction")
);

-- CreateTable
CREATE TABLE "personnel"."services" (
    "code_service" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "code_direction" TEXT NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("code_service")
);

-- CreateTable
CREATE TABLE "personnel"."famille_agents" (
    "id" INTEGER NOT NULL,
    "agent_matricule" TEXT NOT NULL,
    "carte_sociale_path" VARCHAR(50) NOT NULL,

    CONSTRAINT "famille_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel"."conjoints" (
    "id" INTEGER NOT NULL,
    "num_conjoint" INTEGER NOT NULL,

    CONSTRAINT "conjoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel"."enfants" (
    "id" INTEGER NOT NULL,
    "num_enfant" INTEGER NOT NULL,

    CONSTRAINT "enfants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel"."structure_organisationnelle" (
    "id" TEXT NOT NULL,
    "status_pec" "personnel"."status_pec" NOT NULL,
    "structure_organisationnelle_type" "personnel"."structure_organisationnelle_type" NOT NULL,

    CONSTRAINT "structure_organisationnelle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel"."agences" (
    "code_agence" TEXT NOT NULL,
    "nom_agence" TEXT NOT NULL,

    CONSTRAINT "agences_pkey" PRIMARY KEY ("code_agence")
);

-- CreateTable
CREATE TABLE "pec"."attestations" (
    "id" SERIAL NOT NULL,
    "attestation_path" VARCHAR(50) NOT NULL,
    "dt_validation" TIMESTAMP(3) NOT NULL,
    "nature_prestation" VARCHAR(100) NOT NULL,
    "service_prestataire" VARCHAR(50),
    "prestataire_id" INTEGER NOT NULL,
    "beneficiaire_id" TEXT NOT NULL,

    CONSTRAINT "attestations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pec"."beneficiaires" (
    "id" INTEGER NOT NULL,
    "idp" TEXT NOT NULL,
    "observation_idp" TEXT,

    CONSTRAINT "beneficiaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pec"."prestataires" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "status_prestataire" "pec"."statut_prestataire" NOT NULL,
    "nif" TEXT NOT NULL,
    "stat" TEXT NOT NULL,
    "dt_debut_convention" TIMESTAMP(3) NOT NULL,
    "dt_fin_convention" TIMESTAMP(3) NOT NULL,
    "liste_prestation" TEXT NOT NULL,
    "lieu_id" INTEGER NOT NULL,
    "categorie_id" INTEGER NOT NULL,

    CONSTRAINT "prestataires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pec"."lieux" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "lieux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pec"."categories_prestataire" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "categories_prestataire_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agents_matricule_key" ON "personnel"."agents"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "categories_agents_code_category_key" ON "personnel"."categories_agents"("code_category");

-- CreateIndex
CREATE UNIQUE INDEX "conjoints_num_conjoint_key" ON "personnel"."conjoints"("num_conjoint");

-- CreateIndex
CREATE UNIQUE INDEX "enfants_num_enfant_key" ON "personnel"."enfants"("num_enfant");

-- CreateIndex
CREATE UNIQUE INDEX "beneficiaires_idp_key" ON "pec"."beneficiaires"("idp");

-- CreateIndex
CREATE UNIQUE INDEX "prestataires_nif_key" ON "pec"."prestataires"("nif");

-- CreateIndex
CREATE UNIQUE INDEX "prestataires_stat_key" ON "pec"."prestataires"("stat");

-- AddForeignKey
ALTER TABLE "personnel"."agents" ADD CONSTRAINT "agents_id_fkey" FOREIGN KEY ("id") REFERENCES "identifiant"."personnes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel"."agents" ADD CONSTRAINT "agents_structure_orga_id_fkey" FOREIGN KEY ("structure_orga_id") REFERENCES "personnel"."structure_organisationnelle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel"."agents" ADD CONSTRAINT "agents_code_service_fkey" FOREIGN KEY ("code_service") REFERENCES "personnel"."services"("code_service") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel"."agents" ADD CONSTRAINT "agents_fonction_id_fkey" FOREIGN KEY ("fonction_id") REFERENCES "personnel"."fonctions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel"."agents" ADD CONSTRAINT "agents_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "personnel"."categories_agents"("code_category") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel"."directions" ADD CONSTRAINT "directions_code_direction_fkey" FOREIGN KEY ("code_direction") REFERENCES "personnel"."structure_organisationnelle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel"."services" ADD CONSTRAINT "services_code_direction_fkey" FOREIGN KEY ("code_direction") REFERENCES "personnel"."directions"("code_direction") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel"."famille_agents" ADD CONSTRAINT "famille_agents_id_fkey" FOREIGN KEY ("id") REFERENCES "identifiant"."personnes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel"."famille_agents" ADD CONSTRAINT "famille_agents_agent_matricule_fkey" FOREIGN KEY ("agent_matricule") REFERENCES "personnel"."agents"("matricule") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel"."conjoints" ADD CONSTRAINT "conjoints_id_fkey" FOREIGN KEY ("id") REFERENCES "personnel"."famille_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel"."enfants" ADD CONSTRAINT "enfants_id_fkey" FOREIGN KEY ("id") REFERENCES "personnel"."famille_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel"."agences" ADD CONSTRAINT "agences_code_agence_fkey" FOREIGN KEY ("code_agence") REFERENCES "personnel"."structure_organisationnelle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pec"."attestations" ADD CONSTRAINT "attestations_prestataire_id_fkey" FOREIGN KEY ("prestataire_id") REFERENCES "pec"."prestataires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pec"."attestations" ADD CONSTRAINT "attestations_beneficiaire_id_fkey" FOREIGN KEY ("beneficiaire_id") REFERENCES "pec"."beneficiaires"("idp") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pec"."beneficiaires" ADD CONSTRAINT "beneficiaires_id_fkey" FOREIGN KEY ("id") REFERENCES "identifiant"."personnes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pec"."prestataires" ADD CONSTRAINT "prestataires_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "pec"."lieux"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pec"."prestataires" ADD CONSTRAINT "prestataires_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "pec"."categories_prestataire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddCheckConstraint
ALTER TABLE "personnel"."agents" ADD CONSTRAINT "chk_agent_affectation" CHECK (
  CASE "agent_type"
    WHEN 'agent_actif' THEN
      "structure_orga_id" IS NOT NULL
      AND "fonction_id" IS NOT NULL
    ELSE
      "structure_orga_id" IS NULL
      AND "fonction_id" IS NULL
  END
);

-- AddCheckConstraint
ALTER TABLE "pec"."prestataires" ADD CONSTRAINT "chk_prestataire_convention" CHECK (
  "dt_debut_convention" < "dt_fin_convention"
);