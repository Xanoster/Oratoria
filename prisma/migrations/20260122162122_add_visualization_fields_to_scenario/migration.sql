-- AlterTable
ALTER TABLE "RoleplayScenario" ADD COLUMN     "description" TEXT NOT NULL DEFAULT 'Description coming soon...',
ADD COLUMN     "icon" TEXT NOT NULL DEFAULT '📚',
ADD COLUMN     "orderIndex" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "title" TEXT NOT NULL DEFAULT 'Untitled Scenario';

-- CreateIndex
CREATE INDEX "RoleplayScenario_orderIndex_idx" ON "RoleplayScenario"("orderIndex");
