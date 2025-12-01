/*
  Warnings:

  - Made the column `title` on table `conversations` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "model_id" TEXT NOT NULL DEFAULT 'claude-3-7-sonnet-20250219',
ALTER COLUMN "title" SET NOT NULL;

-- CreateIndex
CREATE INDEX "conversations_created_at_idx" ON "conversations"("created_at");
