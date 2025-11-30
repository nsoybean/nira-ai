-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "conversations_threadId_fkey";

-- DropTable: Clean up old Mastra tables and data
DROP TABLE IF EXISTS "mastra_messages" CASCADE;
DROP TABLE IF EXISTS "mastra_threads" CASCADE;
DROP TABLE IF EXISTS "mastra_resources" CASCADE;

-- AlterTable: Remove thread_id from conversations and set default for title
ALTER TABLE "conversations" DROP COLUMN IF EXISTS "thread_id";
ALTER TABLE "conversations" ALTER COLUMN "title" SET DEFAULT 'New Chat';

-- CreateTable: New messages table based on Vercel AI SDK UIMessage format
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "parts" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messages_conversation_id_idx" ON "messages"("conversation_id");
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
