# Nira Documentation (Source of Truth)

This directory contains comprehensive documentation for the Nira project, serving as the **single source of truth** for architecture, design decisions, and implementation details.

## Purpose

The `/llm` directory is specifically designed for:

1. **LLM Context** - Providing complete project context for AI assistants (like Claude)
2. **Onboarding** - Helping new developers understand the system quickly
3. **Architecture Reference** - Documenting technical decisions and rationale
4. **Development Guide** - Step-by-step instructions for common tasks

## Documentation Files

### [ARCHITECTURE.md](./ARCHITECTURE.md)
**System Design & Technical Architecture**

Complete overview of Nira's architecture, including:
- Tech stack breakdown (Next.js 16, AI SDK v5, Mastra, Prisma)
- Project structure and file organization
- Architecture layers (Presentation, API, Data, Agent)
- Data flow diagrams
- Key design decisions and rationale
- AI SDK v5 migration details (parts-based messages)
- Environment configuration
- Deployment considerations
- Future roadmap

**Read this first for:** Understanding the overall system design and technology choices.

---

### [DATABASE.md](./DATABASE.md)
**Database Schema & Persistence**

Complete database documentation:
- PostgreSQL + Prisma ORM setup
- Full schema with all tables (Mastra + custom)
- Detailed column descriptions
- Relationship diagrams
- Common query patterns
- Migration management
- Token usage tracking design
- Performance optimization strategies
- Future enhancements (pgvector, semantic search)

**Read this for:** Understanding data models, relationships, and database operations.

---

### [API.md](./API.md)
**API Routes & Integration**

API reference and integration guide:
- Complete API endpoint documentation
- Request/response formats
- AI SDK v5 streaming protocol
- Frontend integration with `useChat` hook
- Error handling patterns
- AI provider configuration (Anthropic, future: OpenAI, Gemini)
- Rate limiting strategy (future)
- Token usage tracking (future)
- Testing examples (cURL, frontend)

**Read this for:** API integration, streaming implementation, and AI provider setup.

---

### [DEVELOPMENT.md](./DEVELOPMENT.md)
**Developer Guide & Workflows**

Practical development guide:
- Quick start instructions
- Development workflow
- Environment setup (.env.local, .nvmrc)
- Common tasks (add components, modify schema, create pages)
- AI SDK v5 patterns and best practices
- Debugging guide with common issues & solutions
- Code style guidelines
- Git workflow
- Useful commands reference
- Deployment guide (future)

**Read this for:** Day-to-day development tasks, troubleshooting, and best practices.

---

## Quick Reference

### Getting Started

```bash
# 1. Use correct Node.js version
nvm use

# 2. Install dependencies
npm install

# 3. Start Supabase
supabase start --ignore-health-check

# 4. Run migrations
npx prisma migrate dev

# 5. Add API key
echo "ANTHROPIC_API_KEY=your-key" >> .env.local

# 6. Start dev server
npm run dev
```

Visit: http://localhost:3000/chat

---

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.5 | React framework |
| React | 19.2.0 | UI library |
| AI SDK | v5 (5.0.104) | Streaming chat |
| Mastra | 0.24.6 | AI agents |
| Prisma | 6.19.0 | ORM |
| PostgreSQL | Latest | Database |
| TypeScript | 5 | Type safety |
| Tailwind CSS | v4 | Styling |
| shadcn/ui | Latest | Components |

---

### Project Status

**Current Phase:** Phase 1 - Basic Chat Interface

✅ **Completed:**
- Next.js 16 + TypeScript setup
- Database schema design (Prisma + PostgreSQL)
- Chat API with Anthropic streaming
- Real-time UI with AI SDK v5
- Local development environment (Supabase)
- shadcn/ui component library

⏳ **In Progress:**
- Documentation (this directory)
- Mastra integration with PostgreSQL

🔜 **Next:**
- User authentication
- Conversation persistence
- Token usage tracking
- Multi-model support

---

## AI SDK v5 Key Changes

**Important:** Nira uses AI SDK v5, which has significant API changes from v4:

### Import Path
```typescript
// ✅ Correct (v5)
import { useChat } from '@ai-sdk/react';

// ❌ Wrong (v4)
import { useChat } from 'ai/react';
```

### Message Structure
```typescript
// ✅ Correct (v5) - parts-based
{
  id: string;
  role: 'user' | 'assistant';
  parts: [{ type: 'text', text: string }];
}

// ❌ Wrong (v4) - simple content
{
  id: string;
  role: 'user' | 'assistant';
  content: string;
}
```

### Sending Messages
```typescript
// ✅ Correct (v5)
sendMessage({
  role: "user",
  parts: [{ type: "text", text: input }],
});

// ❌ Wrong (v4)
sendMessage("Hello");
```

### Input State
```typescript
// ✅ Correct (v5) - manual state management
const [input, setInput] = useState("");

// ❌ Wrong (v4) - built-in state (no longer exists)
const { input, handleInputChange } = useChat();
```

**See [ARCHITECTURE.md](./ARCHITECTURE.md#1-ai-sdk-v5-migration) for complete details.**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Client)                       │
│  src/app/chat/page.tsx - useChat() from @ai-sdk/react     │
│  - Real-time streaming UI                                   │
│  - Parts-based message rendering                            │
└─────────────────────┬───────────────────────────────────────┘
                      │ POST /api/chat
                      │ { messages: UIMessage[] }
┌─────────────────────▼───────────────────────────────────────┐
│                    API Layer (Server)                       │
│  src/app/api/chat/route.ts - streamText()                  │
│  - Anthropic Claude 3.5 Sonnet                              │
│  - Server-Sent Events streaming                             │
└─────────────────────┬───────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
┌─────────▼─────────┐   ┌─────────▼─────────┐
│  Anthropic API    │   │  PostgreSQL DB     │
│  Claude 3.5       │   │  (via Prisma)      │
│  Sonnet           │   │                    │
│  - Streaming      │   │  - mastra_threads  │
│  - 4K tokens      │   │  - mastra_messages │
└───────────────────┘   │  - conversations   │
                        │  - model_usage     │
                        └────────────────────┘
```

---

## Environment Variables

### Required (.env.local)

```env
# AI Provider API Key
ANTHROPIC_API_KEY=sk-ant-xxx

# Database Connection (Local Supabase)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Never commit `.env.local` to version control!**

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/app/chat/page.tsx` | Chat interface (useChat v5) |
| `src/app/api/chat/route.ts` | Streaming API endpoint |
| `prisma/schema.prisma` | Database schema |
| `.env.local` | Environment variables |
| `.nvmrc` | Node.js version (20.18.2) |
| `package.json` | Dependencies |

---

## Common Debugging

### Issue: Module not found '@ai-sdk/react'
```bash
npm install @ai-sdk/react
```

### Issue: Node.js version error
```bash
nvm use 20
```

### Issue: Docker not running
```bash
open -a Docker
```

### Issue: Supabase unhealthy
```bash
supabase start --ignore-health-check
```

### Issue: Prisma client missing
```bash
npx prisma generate
```

**See [DEVELOPMENT.md](./DEVELOPMENT.md#debugging) for complete troubleshooting guide.**

---

## Development Ports

| Service | Port | URL |
|---------|------|-----|
| Next.js | 3000 | http://localhost:3000 |
| Supabase API | 54321 | http://127.0.0.1:54321 |
| PostgreSQL | 54322 | postgresql://postgres:postgres@127.0.0.1:54322/postgres |
| Supabase Studio | 54323 | http://127.0.0.1:54323 |

---

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # Lint code

# Database
npx prisma studio        # Open Prisma Studio
npx prisma migrate dev   # Create migration
npx prisma generate      # Generate client

# Supabase
supabase start           # Start local DB
supabase stop            # Stop local DB
supabase status          # Check status

# Components
npx shadcn@latest add [component]  # Add UI component
```

---

## Documentation Maintenance

### When to Update Documentation

**ARCHITECTURE.md:** When you:
- Add new technologies or dependencies
- Change system design or data flow
- Make architectural decisions
- Add new layers or services
- Update deployment strategy

**DATABASE.md:** When you:
- Modify Prisma schema
- Add/remove tables or columns
- Change relationships
- Add indexes
- Update query patterns

**API.md:** When you:
- Add/modify API endpoints
- Change request/response formats
- Add new AI providers
- Implement new features (auth, rate limiting)
- Update streaming protocol

**DEVELOPMENT.md:** When you:
- Add development tools
- Change workflow processes
- Update environment variables
- Add new debugging solutions
- Change deployment procedures

### Documentation Guidelines

1. **Keep it current** - Update docs alongside code changes
2. **Be comprehensive** - Document the "why", not just the "what"
3. **Include examples** - Show real code snippets
4. **Link references** - Point to official documentation
5. **Version notes** - Mention version-specific details (e.g., AI SDK v5)

---

## For LLM Assistants

When working with this project:

1. **Read all docs** in this directory to understand the full context
2. **Follow patterns** already established in the codebase
3. **Update docs** when making changes
4. **Use AI SDK v5** patterns (parts-based messages, sendMessage, status)
5. **Check DATABASE.md** before modifying schema
6. **Reference API.md** when adding endpoints
7. **Follow DEVELOPMENT.md** conventions

---

## Version History

- **2025-01-29** - Initial documentation created
  - Complete architecture documentation
  - Database schema reference
  - API documentation with v5 patterns
  - Development guide with troubleshooting

---

## Contributing

When adding to this documentation:

1. Follow existing format and style
2. Include code examples where relevant
3. Add links to external references
4. Update this README if adding new files
5. Keep information accurate and current

---

## External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel AI SDK v5](https://ai-sdk.dev/docs)
- [Mastra Framework](https://mastra.ai/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Anthropic API](https://docs.anthropic.com)

---

## License

TBD

---

**Last Updated:** 2025-01-29
**Maintained By:** Nira Development Team
**Purpose:** Single source of truth for Nira architecture and development
