-- AlterTable
ALTER TABLE "pec"."attestations" ADD COLUMN     "is_validate" BOOLEAN DEFAULT false,
ALTER COLUMN "dt_validation" DROP NOT NULL;
