# Nira - Database Schema Documentation

## Overview

Nira uses PostgreSQL with Prisma ORM for type-safe database operations. The schema is designed to integrate Mastra framework's persistence requirements with custom business logic for conversation management, user tracking, and token usage analytics.

## Database Provider

- **Development:** Local Supabase (Docker) on port 54322
- **Production:** Flexible (Supabase Cloud, Neon, Railway, etc.)
- **Connection:** `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- **Studio UI:** http://127.0.0.1:54323

## Schema Design Philosophy

1. **Mastra Tables:** Follow framework conventions for AI agent persistence
2. **Custom Tables:** Application-specific business logic
3. **JSON Storage:** Flexible message content in V2 format
4. **Indexing:** Optimized for conversation queries
5. **Soft Deletes:** Preserve data with timestamps
6. **Future-Ready:** Designed for pgvector semantic search

## Complete Schema

### Mastra Framework Tables

These tables follow Mastra's persistence architecture for AI agents, threads, and messages.

#### mastra_threads

Stores conversation threads with metadata.

```prisma
model MastraThread {
  id        String   @id @default(uuid())
  title     String?
  metadata  Json?    // Flexible metadata storage
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  messages  MastraMessage[]

  @@map("mastra_threads")
}
```

**Columns:**
- `id` (UUID): Primary key
- `title` (String, optional): Thread title/summary
- `metadata` (JSON, optional): Flexible storage for thread context
- `createdAt` (DateTime): Thread creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relations:**
- One-to-Many with `mastra_messages`

**Indexes:**
- Primary: `id`
- Auto: `createdAt` for sorting

---

#### mastra_messages

Stores messages in Mastra V2 JSON format.

```prisma
model MastraMessage {
  id         String   @id @default(uuid())
  threadId   String   @map("thread_id")
  resourceId String?  @map("resource_id")
  content    Json     // V2 Message format
  role       String   // 'user', 'assistant', 'system', 'tool'
  type       String?  // 'text' | 'tool-call' | 'tool-result'
  createdAt  DateTime @default(now()) @map("created_at")

  thread MastraThread @relation(fields: [threadId], references: [id], onDelete: Cascade)

  @@map("mastra_messages")
  @@index([threadId])
  @@index([createdAt])
}
```

**Columns:**
- `id` (UUID): Primary key
- `threadId` (UUID): Foreign key to thread
- `resourceId` (UUID, optional): Link to resources
- `content` (JSON): Full message in V2 format (parts-based)
- `role` (String): Message role (user/assistant/system/tool)
- `type` (String, optional): Message type for tool calls
- `createdAt` (DateTime): Message timestamp

**V2 Message Format (JSON):**
```json
{
  "id": "msg_xxx",
  "role": "user",
  "parts": [
    {
      "type": "text",
      "text": "Hello, Nira!"
    }
  ]
}
```

**Relations:**
- Many-to-One with `mastra_threads` (CASCADE delete)

**Indexes:**
- Primary: `id`
- Foreign: `threadId`
- Query: `createdAt` (for message history)

---

#### mastra_resources

Stores AI agent resources and artifacts.

```prisma
model MastraResource {
  id        String   @id @default(uuid())
  name      String
  type      String   // 'document', 'tool', 'embedding', etc.
  content   Json     // Flexible resource content
  metadata  Json?    // Additional metadata
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("mastra_resources")
  @@index([type])
}
```

**Columns:**
- `id` (UUID): Primary key
- `name` (String): Resource name
- `type` (String): Resource type
- `content` (JSON): Resource data
- `metadata` (JSON, optional): Additional context
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relations:** None (standalone resources)

**Indexes:**
- Primary: `id`
- Query: `type` (for filtering by resource type)

---

### Custom Application Tables

These tables implement Nira-specific business logic.

#### users

User accounts and profiles.

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  avatarUrl String?  @map("avatar_url")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  conversations   Conversation[]
  preferences     UserPreference?
  modelUsage      ModelUsage[]

  @@map("users")
  @@index([email])
}
```

**Columns:**
- `id` (UUID): Primary key
- `email` (String): Unique email address
- `name` (String, optional): Display name
- `avatarUrl` (String, optional): Profile picture URL
- `createdAt` (DateTime): Account creation
- `updatedAt` (DateTime): Last profile update

**Relations:**
- One-to-Many with `conversations`
- One-to-One with `user_preferences`
- One-to-Many with `model_usage`

**Indexes:**
- Primary: `id`
- Unique: `email`

---

#### user_preferences

User settings and preferences.

```prisma
model UserPreference {
  id               String   @id @default(uuid())
  userId           String   @unique @map("user_id")
  defaultModel     String?  @map("default_model")
  theme            String   @default("system") // 'light', 'dark', 'system'
  language         String   @default("en")
  streamingEnabled Boolean  @default(true) @map("streaming_enabled")
  settings         Json?    // Additional flexible settings
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_preferences")
}
```

**Columns:**
- `id` (UUID): Primary key
- `userId` (UUID): Foreign key to user (unique)
- `defaultModel` (String, optional): Preferred AI model
- `theme` (String): UI theme preference
- `language` (String): Interface language
- `streamingEnabled` (Boolean): Enable/disable streaming
- `settings` (JSON, optional): Flexible settings storage
- `createdAt` (DateTime): Preference creation
- `updatedAt` (DateTime): Last update

**Relations:**
- One-to-One with `users` (CASCADE delete)

**Indexes:**
- Primary: `id`
- Unique: `userId`

---

#### conversations

Chat sessions and metadata.

```prisma
model Conversation {
  id          String   @id @default(uuid())
  userId      String?  @map("user_id")
  threadId    String?  @unique @map("thread_id") // Link to Mastra thread
  title       String?
  modelId     String   @map("model_id") // 'claude-3-5-sonnet-20241022', etc.
  modelProvider String @map("model_provider") // 'anthropic', 'openai', etc.
  metadata    Json?    // Conversation context
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user       User?         @relation(fields: [userId], references: [id], onDelete: SetNull)
  modelUsage ModelUsage[]

  @@map("conversations")
  @@index([userId])
  @@index([createdAt])
  @@index([modelProvider])
}
```

**Columns:**
- `id` (UUID): Primary key
- `userId` (UUID, optional): Owner of conversation
- `threadId` (UUID, optional): Link to Mastra thread
- `title` (String, optional): Conversation title
- `modelId` (String): Specific model version
- `modelProvider` (String): AI provider name
- `metadata` (JSON, optional): Additional context
- `createdAt` (DateTime): Conversation start
- `updatedAt` (DateTime): Last activity

**Relations:**
- Many-to-One with `users` (SETNULL on delete)
- One-to-Many with `model_usage`

**Indexes:**
- Primary: `id`
- Unique: `threadId`
- Query: `userId`, `createdAt`, `modelProvider`

---

#### model_usage

Token usage and cost tracking.

```prisma
model ModelUsage {
  id               String   @id @default(uuid())
  conversationId   String   @map("conversation_id")
  userId           String?  @map("user_id")
  modelId          String   @map("model_id")
  modelProvider    String   @map("model_provider")
  inputTokens      Int      @default(0) @map("input_tokens")
  outputTokens     Int      @default(0) @map("output_tokens")
  totalTokens      Int      @default(0) @map("total_tokens")
  estimatedCost    Float    @default(0) @map("estimated_cost") // In USD
  responseTimeMs   Int?     @map("response_time_ms")
  success          Boolean  @default(true)
  errorMessage     String?  @map("error_message")
  createdAt        DateTime @default(now()) @map("created_at")

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user         User?        @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@map("model_usage")
  @@index([conversationId])
  @@index([userId])
  @@index([createdAt])
  @@index([modelProvider])
}
```

**Columns:**
- `id` (UUID): Primary key
- `conversationId` (UUID): Foreign key to conversation
- `userId` (UUID, optional): User who made request
- `modelId` (String): Specific model version
- `modelProvider` (String): Provider name
- `inputTokens` (Int): Prompt tokens used
- `outputTokens` (Int): Completion tokens used
- `totalTokens` (Int): Total tokens (input + output)
- `estimatedCost` (Float): Cost in USD
- `responseTimeMs` (Int, optional): Response time
- `success` (Boolean): Request success status
- `errorMessage` (String, optional): Error details
- `createdAt` (DateTime): Usage timestamp

**Relations:**
- Many-to-One with `conversations` (CASCADE delete)
- Many-to-One with `users` (SETNULL on delete)

**Indexes:**
- Primary: `id`
- Query: `conversationId`, `userId`, `createdAt`, `modelProvider`

---

## Relationships Overview

```
users
  ├─→ conversations (1:N)
  ├─→ user_preferences (1:1)
  └─→ model_usage (1:N)

conversations
  ├─→ model_usage (1:N)
  └─→ mastra_threads (1:1 optional link)

mastra_threads
  └─→ mastra_messages (1:N CASCADE)

mastra_resources (standalone)
```

## Common Queries

### Get User's Conversations

```typescript
const conversations = await prisma.conversation.findMany({
  where: { userId: 'user-id' },
  orderBy: { updatedAt: 'desc' },
  include: {
    modelUsage: {
      select: {
        totalTokens: true,
        estimatedCost: true,
      },
    },
  },
});
```

### Get Conversation with Messages

```typescript
const conversation = await prisma.conversation.findUnique({
  where: { id: 'conv-id' },
  include: {
    user: true,
    modelUsage: true,
  },
});

// Get linked Mastra messages if threadId exists
if (conversation.threadId) {
  const messages = await prisma.mastraMessage.findMany({
    where: { threadId: conversation.threadId },
    orderBy: { createdAt: 'asc' },
  });
}
```

### Track Token Usage

```typescript
await prisma.modelUsage.create({
  data: {
    conversationId: 'conv-id',
    userId: 'user-id',
    modelId: 'claude-3-5-sonnet-20241022',
    modelProvider: 'anthropic',
    inputTokens: 1500,
    outputTokens: 800,
    totalTokens: 2300,
    estimatedCost: 0.0115, // $0.0115 USD
    responseTimeMs: 2340,
    success: true,
  },
});
```

### Get User's Total Usage

```typescript
const usage = await prisma.modelUsage.aggregate({
  where: { userId: 'user-id' },
  _sum: {
    totalTokens: true,
    estimatedCost: true,
  },
  _count: true,
});
```

## Migrations

### Current State

```bash
# Run migrations
npx prisma migrate dev --name init

# View database in Prisma Studio
npx prisma studio

# Generate Prisma Client
npx prisma generate
```

### Migration Files Location

`prisma/migrations/` contains all migration history.

## Future Enhancements

### Phase 1 (Planned)
- [ ] Add `pgvector` extension for semantic search
- [ ] Add embeddings column to `mastra_messages`
- [ ] Implement full-text search on messages
- [ ] Add conversation sharing tables

### Phase 2 (Future)
- [ ] Add rate limiting tables
- [ ] Implement audit logs
- [ ] Add webhook event tables
- [ ] Multi-tenancy support

## Pricing Reference (for cost tracking)

### Claude 3.5 Sonnet (20241022)
- Input: $0.003 per 1K tokens
- Output: $0.015 per 1K tokens

### Calculation Example
```typescript
const inputCost = (inputTokens / 1000) * 0.003;
const outputCost = (outputTokens / 1000) * 0.015;
const totalCost = inputCost + outputCost;
```

## Data Retention

**Current:** All data persisted indefinitely

**Future Policies:**
- Anonymous users: 30 days
- Authenticated users: Configurable (default: 1 year)
- Deleted conversations: Soft delete with 30-day recovery
- Model usage: Aggregate after 90 days

## Backup Strategy

**Development:** Supabase CLI backups

**Production Recommendations:**
- Daily automated backups
- Point-in-time recovery (PITR)
- Cross-region replication
- Export to cold storage (S3) for long-term retention

## Performance Optimization

1. **Indexes:** Already defined on foreign keys and query columns
2. **Connection Pooling:** Required for production (Prisma + pgBouncer)
3. **Query Optimization:** Use Prisma's `select` and `include` strategically
4. **Pagination:** Implement cursor-based pagination for large result sets
5. **Caching:** Consider Redis for frequent conversation queries

## Security Considerations

1. **RLS (Row Level Security):** Not yet implemented, required for multi-tenancy
2. **Soft Deletes:** Preserve data integrity
3. **Encryption:** Database-level encryption in production
4. **Access Control:** Prisma client middleware for authorization
5. **Sensitive Data:** Never store API keys in database

## Monitoring

**Recommended Tools:**
- Prisma Studio (development)
- Supabase Dashboard (production)
- Custom analytics dashboard (future)
- Database metrics (connection pool, query performance)

## References

- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Mastra Persistence](https://mastra.ai/docs/persistence)
- [PostgreSQL JSON Types](https://www.postgresql.org/docs/current/datatype-json.html)
- [pgvector Extension](https://github.com/pgvector/pgvector)
