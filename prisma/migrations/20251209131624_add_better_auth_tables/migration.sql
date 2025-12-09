-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verified" BOOL NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN     "image" STRING;

-- CreateTable
CREATE TABLE "sessions" (
    "id" STRING NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "token" STRING NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ip_address" STRING,
    "user_agent" STRING,
    "user_id" STRING NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" STRING NOT NULL,
    "account_id" STRING NOT NULL,
    "provider_id" STRING NOT NULL,
    "user_id" STRING NOT NULL,
    "access_token" STRING,
    "refresh_token" STRING,
    "id_token" STRING,
    "access_token_expires_at" TIMESTAMP(3),
    "refresh_token_expires_at" TIMESTAMP(3),
    "scope" STRING,
    "password" STRING,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" STRING NOT NULL,
    "identifier" STRING NOT NULL,
    "value" STRING NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
