/*
  Warnings:

  - Changed the type of `matricule` on the `agents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `agent_matricule` on the `famille_agents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "personnel"."famille_agents" DROP CONSTRAINT "famille_agents_agent_matricule_fkey";

-- AlterTable
ALTER TABLE "personnel"."agents" DROP COLUMN "matricule",
ADD COLUMN     "matricule" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "personnel"."famille_agents" DROP COLUMN "agent_matricule",
ADD COLUMN     "agent_matricule" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "agents_matricule_key" ON "personnel"."agents"("matricule");

-- AddForeignKey
ALTER TABLE "personnel"."famille_agents" ADD CONSTRAINT "famille_agents_agent_matricule_fkey" FOREIGN KEY ("agent_matricule") REFERENCES "personnel"."agents"("matricule") ON DELETE CASCADE ON UPDATE CASCADE;
