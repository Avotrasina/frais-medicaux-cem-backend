-- AlterTable
ALTER TABLE "facturation"."facture_globale" ALTER COLUMN "montant_total" DROP NOT NULL;

-- AlterTable
ALTER TABLE "facturation"."piece_jointe_facture" ALTER COLUMN "taille_octets" DROP DEFAULT;
