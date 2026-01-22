/*
  Warnings:

  - You are about to drop the column `createdAt` on the `RoleplayScenario` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RoleplayScenario" DROP COLUMN "createdAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Sentence" ADD COLUMN     "roleplayScenarioId" TEXT;

-- CreateIndex
CREATE INDEX "Sentence_roleplayScenarioId_idx" ON "Sentence"("roleplayScenarioId");

-- AddForeignKey
ALTER TABLE "Sentence" ADD CONSTRAINT "Sentence_roleplayScenarioId_fkey" FOREIGN KEY ("roleplayScenarioId") REFERENCES "RoleplayScenario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
