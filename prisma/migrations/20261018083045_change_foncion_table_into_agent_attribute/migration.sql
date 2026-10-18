/*
  Warnings:

  - You are about to drop the column `fonction_id` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the `fonctions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "personnel"."agents" DROP CONSTRAINT "agents_fonction_id_fkey";

-- AlterTable
ALTER TABLE "personnel"."agents" DROP COLUMN "fonction_id",
ADD COLUMN     "fonction" TEXT;

-- DropTable
DROP TABLE "personnel"."fonctions";
