ALTER TABLE "utilisateur"."utilisateur"
ADD COLUMN "username" TEXT,
ADD COLUMN "email" TEXT,
ADD COLUMN "mot_de_passe" TEXT,
ADD COLUMN "profil" TEXT;

CREATE UNIQUE INDEX "utilisateur_email_key"
ON "utilisateur"."utilisateur"("email");
