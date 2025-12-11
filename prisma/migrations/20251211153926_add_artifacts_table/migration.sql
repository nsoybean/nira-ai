-- CreateTable
CREATE TABLE "artifacts" (
    "id" STRING NOT NULL,
    "conversation_id" STRING NOT NULL,
    "message_id" STRING NOT NULL,
    "user_id" STRING,
    "type" STRING NOT NULL,
    "content" JSONB NOT NULL,
    "version" STRING NOT NULL DEFAULT '1',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "artifacts_conversation_id_idx" ON "artifacts"("conversation_id");

-- CreateIndex
CREATE INDEX "artifacts_message_id_idx" ON "artifacts"("message_id");

-- CreateIndex
CREATE INDEX "artifacts_user_id_idx" ON "artifacts"("user_id");

-- CreateIndex
CREATE INDEX "artifacts_type_idx" ON "artifacts"("type");

-- CreateIndex
CREATE INDEX "artifacts_created_at_idx" ON "artifacts"("created_at");

-- AddForeignKey
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
