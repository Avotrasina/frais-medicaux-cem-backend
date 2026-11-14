-- CreateTable
CREATE TABLE "pec"."conventions" (
    "id" SERIAL NOT NULL,
    "convention_path" TEXT NOT NULL,
    "id_prestataire" INTEGER NOT NULL,

    CONSTRAINT "conventions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pec"."conventions" ADD CONSTRAINT "conventions_id_prestataire_fkey" FOREIGN KEY ("id_prestataire") REFERENCES "pec"."prestataires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
