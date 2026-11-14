ALTER TYPE "facturation"."statut_facture" RENAME VALUE 'annulee' TO 'supprimee';
ALTER TYPE "facturation"."statut_facture" ADD VALUE 'a_revalider';
ALTER TYPE "facturation"."statut_facture" ADD VALUE 'suppression_demandee';

ALTER TYPE "facturation"."type_mouvement" RENAME VALUE 'annulation' TO 'suppression';
ALTER TYPE "facturation"."type_mouvement" ADD VALUE 'reouverture';
ALTER TYPE "facturation"."type_mouvement" ADD VALUE 'demande_suppression';
ALTER TYPE "facturation"."type_mouvement" ADD VALUE 'refus_suppression';

ALTER TABLE "facturation"."facture_globale"
  ADD COLUMN "statut_avant_suppression" "facturation"."statut_facture";
