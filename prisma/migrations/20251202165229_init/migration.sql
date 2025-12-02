-- CreateTable
CREATE TABLE "messages" (
    "id" STRING NOT NULL,
    "conversation_id" STRING NOT NULL,
    "role" STRING NOT NULL,
    "parts" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" STRING NOT NULL,
    "email" STRING NOT NULL,
    "name" STRING,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" STRING NOT NULL,
    "user_id" STRING NOT NULL,
    "default_model" STRING NOT NULL DEFAULT 'claude-3-5-sonnet-20241022',
    "theme" STRING NOT NULL DEFAULT 'light',
    "settings" JSONB,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" STRING NOT NULL,
    "user_id" STRING,
    "title" STRING NOT NULL DEFAULT 'New Chat',
    "model_id" STRING NOT NULL DEFAULT 'claude-3-7-sonnet-20250219',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_usage" (
    "id" STRING NOT NULL,
    "conversation_id" STRING NOT NULL,
    "user_id" STRING,
    "model_id" STRING NOT NULL,
    "model_provider" STRING NOT NULL,
    "input_tokens" INT4 NOT NULL DEFAULT 0,
    "output_tokens" INT4 NOT NULL DEFAULT 0,
    "total_tokens" INT4 NOT NULL DEFAULT 0,
    "estimated_cost" FLOAT8 NOT NULL DEFAULT 0,
    "response_time_ms" INT4,
    "success" BOOL NOT NULL DEFAULT true,
    "error_message" STRING,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messages_conversation_id_idx" ON "messages"("conversation_id");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "user_preferences"("user_id");

-- CreateIndex
CREATE INDEX "conversations_user_id_idx" ON "conversations"("user_id");

-- CreateIndex
CREATE INDEX "conversations_created_at_idx" ON "conversations"("created_at");

-- CreateIndex
CREATE INDEX "conversations_last_message_at_idx" ON "conversations"("last_message_at");

-- CreateIndex
CREATE INDEX "model_usage_conversation_id_idx" ON "model_usage"("conversation_id");

-- CreateIndex
CREATE INDEX "model_usage_user_id_idx" ON "model_usage"("user_id");

-- CreateIndex
CREATE INDEX "model_usage_model_id_idx" ON "model_usage"("model_id");

-- CreateIndex
CREATE INDEX "model_usage_created_at_idx" ON "model_usage"("created_at");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_usage" ADD CONSTRAINT "model_usage_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_usage" ADD CONSTRAINT "model_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
