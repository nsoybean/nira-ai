# Nira - Architecture Documentation

## Overview

Nira is a modern, multi-model AI chatbot built with Next.js 16, featuring Claude 3.5 Sonnet integration with plans to support multiple AI providers. The application uses a clean, modern architecture with PostgreSQL for persistence and Mastra framework for advanced AI agent capabilities.

## Tech Stack

### Frontend
- **Next.js 16.0.5** - React framework with App Router and Turbopack
- **React 19.2.0** - UI library with React Compiler
- **TypeScript 5** - Type safety
- **Tailwind CSS v4** - Styling (@tailwindcss/postcss)
- **shadcn/ui** - Component library built on Radix UI primitives

### Backend
- **Next.js API Routes** - Server-side API endpoints
- **Vercel AI SDK v5** - Streaming chat interface
  - `ai@5.0.104` - Core AI SDK
  - `@ai-sdk/react@2.0.104` - React hooks (useChat)
  - `@ai-sdk/anthropic@2.0.50` - Anthropic provider
- **Mastra Framework** (@mastra/core v0.24.6) - AI agents orchestration

### Database
- **PostgreSQL** - Primary database
- **Prisma ORM v6.19.0** - Type-safe database client
- **Supabase CLI** - Local development environment
- **pg v8.16.3** - PostgreSQL driver

## Project Structure

```
lume/
├── llm/                          # Documentation (source of truth)
│   ├── ARCHITECTURE.md           # System architecture (this file)
│   ├── DATABASE.md               # Database schema documentation
│   ├── API.md                    # API routes documentation
│   └── DEVELOPMENT.md            # Development guide
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Database migrations
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.ts      # Chat streaming API endpoint
│   │   ├── chat/
│   │   │   └── page.tsx          # Chat interface component
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   └── components/
│       └── ui/                   # shadcn/ui components
│           ├── button.tsx
│           ├── input.tsx
│           ├── card.tsx
│           └── avatar.tsx
├── .env.local                    # Environment variables
├── .nvmrc                        # Node.js version (20.18.2)
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## Architecture Layers

### 1. Presentation Layer (Frontend)

**Location:** `src/app/chat/page.tsx`

The chat interface is a client component built with AI SDK v5's new transport-based architecture.

**Key Features:**
- Real-time streaming responses
- Message history display
- Auto-scrolling to latest message
- Loading states
- Error handling

**AI SDK v5 Integration:**
```typescript
import { useChat } from '@ai-sdk/react';

const {
  messages,      // UIMessage[] with parts structure
  status,        // 'idle' | 'submitted' | 'streaming' | 'error'
  error,         // Error object if any
  sendMessage,   // (message: CreateUIMessage) => void
  stop,          // Stop streaming
  regenerate,    // Regenerate last response
} = useChat();
```

**Message Structure (AI SDK v5):**
```typescript
interface UIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  parts: MessagePart[];  // NOT 'content' anymore!
}

interface MessagePart {
  type: 'text' | 'tool-call' | 'tool-result';
  text?: string;
  toolCallId?: string;
  toolName?: string;
  args?: any;
  result?: any;
}
```

### 2. API Layer (Backend)

**Location:** `src/app/api/chat/route.ts`

Next.js API Route that handles streaming chat completions.

**Key Features:**
- Streaming text responses
- Anthropic Claude 3.5 Sonnet integration
- System prompt configuration
- Temperature and token control

**Implementation:**
```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    messages,
    system: 'You are Nira...',
    temperature: 0.7,
    maxTokens: 4000,
  });

  return result.toDataStreamResponse();
}
```

### 3. Data Layer (Database)

**Location:** `prisma/schema.prisma`

PostgreSQL database with Prisma ORM, integrating Mastra's persistence requirements with custom business logic.

**Schema Categories:**
1. **Mastra Tables** - Framework requirements
   - `mastra_threads` - Conversation threads
   - `mastra_messages` - Message history in V2 JSON format
   - `mastra_resources` - Agent resources

2. **Business Tables** - Application logic
   - `users` - User accounts
   - `user_preferences` - User settings
   - `conversations` - Chat sessions
   - `model_usage` - Token tracking and costs

### 4. Agent Layer (Future)

**Framework:** Mastra (@mastra/core v0.24.6)

**Planned Features:**
- Multi-step reasoning agents
- Tool calling and function execution
- Memory layers (conversation, semantic, working)
- Advanced orchestration

## Data Flow

### Chat Message Flow

```
User Input (Frontend)
    ↓
sendMessage({ role: 'user', parts: [{ type: 'text', text: input }] })
    ↓
useChat hook (AI SDK React)
    ↓
POST /api/chat
    ↓
streamText (AI SDK Core)
    ↓
Anthropic API
    ↓
Streaming Response
    ↓
toDataStreamResponse()
    ↓
Real-time UI Updates (parts-based messages)
```

### Database Persistence Flow (Planned)

```
Chat Completion
    ↓
Mastra Agent (if applicable)
    ↓
Prisma Client
    ↓
PostgreSQL
    ↓
Store in:
  - mastra_messages (message content)
  - mastra_threads (conversation context)
  - model_usage (token tracking)
```

## Key Design Decisions

### 1. AI SDK v5 Migration

**Decision:** Use AI SDK v5's new transport architecture with `@ai-sdk/react`

**Rationale:**
- Modern streaming architecture
- Better separation of concerns
- More flexible message structure with `parts` array
- Support for multi-modal content (future)

**Impact:**
- No built-in input state management (manual useState required)
- Messages use `parts` array instead of `content` string
- `sendMessage()` instead of `handleSubmit()`
- `status` instead of `isLoading`

### 2. Mastra Integration

**Decision:** Use Mastra framework for agent orchestration

**Rationale:**
- Built-in persistence layer
- Advanced memory management
- Multi-step reasoning capabilities
- Standardized message format (V2)

**Schema Integration:**
- Mastra tables follow framework conventions
- Custom tables extend functionality
- JSON storage for flexible message content

### 3. PostgreSQL + Prisma

**Decision:** PostgreSQL with Prisma ORM

**Rationale:**
- Type-safe database queries
- Easy migrations
- Support for JSON columns (Mastra messages)
- Future pgvector support for semantic search
- Flexibility to move to production DB (Supabase, Neon, etc.)

### 4. Local Development with Supabase

**Decision:** Use Supabase CLI for local PostgreSQL

**Rationale:**
- Full local database stack
- Studio UI for data inspection
- Easy migration to Supabase Cloud
- Docker-based, reproducible environment

## Environment Configuration

**Required Variables:**
```env
# AI Provider
ANTHROPIC_API_KEY=sk-ant-xxx

# Database (Local Supabase)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Supabase (for future features)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Development Setup

1. **Node.js Version:** 20.18.2 (managed via .nvmrc)
2. **Package Manager:** npm
3. **Database:** Local Supabase via Docker
4. **Port:** 3000 (Next.js), 54321 (Supabase), 54323 (Supabase Studio)

## Deployment Considerations

### Frontend
- Deploy to Vercel (optimized for Next.js 16)
- Edge runtime for API routes
- Streaming responses supported

### Database
- Migration options:
  - Supabase Cloud (easy migration path)
  - Neon (serverless Postgres)
  - Railway, Render, etc.
- Prisma migrations work across all PostgreSQL providers

### Environment Variables
- Add all vars to deployment platform
- Use secrets management for API keys
- Configure database connection pooling for production

## Future Roadmap

### Phase 1 (Current)
✅ Basic chat interface with Claude 3.5 Sonnet
✅ Streaming responses
✅ Database schema design
⏳ Mastra integration with PostgreSQL persistence

### Phase 2 (Next)
- [ ] User authentication
- [ ] Conversation persistence
- [ ] Token usage tracking
- [ ] Model selection UI

### Phase 3 (Future)
- [ ] Multi-model support (GPT-4, Gemini)
- [ ] AI Agents with Mastra
- [ ] Tool calling / function execution
- [ ] Semantic search with pgvector
- [ ] Advanced memory management

## Security Considerations

1. **API Keys:** Stored in environment variables, never committed
2. **Database:** Local development isolated, production uses connection pooling
3. **Input Validation:** Client-side checks, server-side validation needed
4. **Rate Limiting:** Not yet implemented (required for production)
5. **Authentication:** Not yet implemented (required for multi-user)

## Performance Considerations

1. **Streaming:** Real-time UI updates without waiting for full response
2. **Database Indexing:** Optimized for conversation queries
3. **Connection Pooling:** Required for production (Prisma + pg)
4. **Caching:** Not yet implemented (future: Redis for conversation context)

## Monitoring & Observability

**Current:** Development logs only

**Future:**
- Application logging (Winston, Pino)
- Error tracking (Sentry)
- Performance monitoring (Vercel Analytics)
- Token usage analytics (custom dashboard)
- Model performance metrics

## References

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Vercel AI SDK](https://ai-sdk.dev/docs)
- [Mastra Framework](https://mastra.ai/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [shadcn/ui](https://ui.shadcn.com)
