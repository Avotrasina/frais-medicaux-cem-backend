CREATE SCHEMA IF NOT EXISTS "utilisateur";

ALTER TYPE "facturation"."role_utilisateur" SET SCHEMA "utilisateur";
ALTER TABLE "facturation"."utilisateur" SET SCHEMA "utilisateur";
