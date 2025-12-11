# Nira - Development Guide

## Quick Start

### Prerequisites

- **Node.js:** 20.18.2+ (managed via .nvmrc)
- **npm:** 10.8.2+
- **Docker:** Docker Desktop running
- **Supabase CLI:** Installed globally

### Installation

```bash
# Clone repository
cd /Users/nyangshawbin/Documents/projects/lume

# Use correct Node.js version
nvm use

# Install dependencies
npm install

# Start Supabase (Docker required)
supabase start --ignore-health-check

# Run database migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# Add your Anthropic API key to .env.local
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" >> .env.local

# Start development server
npm run dev
```

Visit: http://localhost:3000/chat

---

## Development Workflow

### 1. Starting Development

```bash
# Ensure Docker is running
open -a Docker

# Start Supabase
supabase start --ignore-health-check

# Start Next.js dev server
npm run dev
```

### 2. Database Management

```bash
# Create migration after schema changes
npx prisma migrate dev --name describe_your_changes

# Reset database (warning: deletes all data)
npx prisma migrate reset

# Open Prisma Studio (GUI)
npx prisma studio

# Open Supabase Studio
# Visit: http://127.0.0.1:54323
```

### 3. Making Changes

**File Structure:**

- Frontend: `src/app/**/*.tsx`
- API: `src/app/api/**/*.ts`
- Database: `prisma/schema.prisma`
- Components: `src/components/ui/**/*.tsx`
- Docs: `llm/**/*.md`

**Hot Reload:**

- Next.js Turbopack provides fast refresh
- Changes to frontend code reload instantly
- Changes to API routes require manual refresh

### 4. Stopping Development

```bash
# Stop Next.js (Ctrl+C)
# Stop Supabase
supabase stop
```

---

## Environment Setup

### Required Files

#### .env.local

```env
# AI Provider
ANTHROPIC_API_KEY=sk-ant-xxx

# Database (Local Supabase)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Supabase (for future features)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### .nvmrc

```
20.18.2
```

**Never commit `.env.local` to version control!**

---

## Common Tasks

### Add a New UI Component (shadcn/ui)

```bash
# List available components
npx shadcn@latest add

# Add specific component
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
```

Components are installed to `src/components/ui/`

### Modify Database Schema

1. Edit `prisma/schema.prisma`
2. Create migration:
   ```bash
   npx prisma migrate dev --name add_new_field
   ```
3. Regenerate Prisma Client:
   ```bash
   npx prisma generate
   ```

### Add a New API Route

1. Create file: `src/app/api/your-route/route.ts`
2. Export HTTP method handlers:

   ```typescript
   export async function GET(req: Request) {
   	return Response.json({ message: "Hello" });
   }

   export async function POST(req: Request) {
   	const body = await req.json();
   	return Response.json({ received: body });
   }
   ```

### Add a New Page

1. Create file: `src/app/your-page/page.tsx`
2. Export default component:
   ```typescript
   export default function YourPage() {
     return <div>Your content</div>;
   }
   ```

Visit: http://localhost:3000/your-page

---

## AI SDK v5 Patterns

### useChat Hook

```typescript
import { useChat } from "@ai-sdk/react";

const {
	messages, // UIMessage[]
	status, // 'idle' | 'submitted' | 'streaming' | 'error'
	error, // Error | undefined
	sendMessage, // Send a message
	stop, // Stop streaming
	regenerate, // Regenerate last response
} = useChat({
	api: "/api/chat",
});
```

### Sending Messages (v5 Format)

```typescript
// CORRECT (v5)
sendMessage({
	role: "user",
	parts: [{ type: "text", text: input }],
});

// WRONG (v4 - don't use!)
sendMessage("Hello"); // This won't work!
```

### Rendering Messages (v5 Format)

```typescript
// CORRECT (v5 - parts-based)
{messages.map((message) => (
  <div key={message.id}>
    {message.parts
      .filter((part) => part.type === "text")
      .map((part, i) => (
        <span key={i}>{part.text}</span>
      ))}
  </div>
))}

// WRONG (v4 - don't use!)
{messages.map((message) => (
  <div key={message.id}>{message.content}</div>
))}
```

### Input State Management (v5)

```typescript
// v5 doesn't provide input state - manage manually
const [input, setInput] = useState("");

<Input
  value={input}
  onChange={(e) => setInput(e.target.value)}
/>
```

---

## Debugging

### Check Logs

```bash
# Next.js logs (terminal where npm run dev is running)
# Shows:
# - Compilation status
# - API requests (GET /api/chat 200)
# - Errors

# Supabase logs
supabase status
```

### Common Issues

#### 1. Module Not Found Errors

**Issue:** `Module not found: Can't resolve '@ai-sdk/react'`

**Solution:**

```bash
npm install @ai-sdk/react
```

#### 2. Node.js Version Error

**Issue:** `Prisma only supports Node.js versions 20.19+`

**Solution:**

```bash
nvm use 20
# or
nvm use  # if .nvmrc is present
```

#### 3. Docker Not Running

**Issue:** `Cannot connect to the Docker daemon`

**Solution:**

```bash
open -a Docker
# Wait for Docker to start, then retry
```

#### 4. Supabase Container Unhealthy

**Issue:** `supabase_analytics_lume container is not ready: unhealthy`

**Solution:**

```bash
supabase stop
supabase start --ignore-health-check
```

#### 5. Database Connection Error

**Issue:** `Can't reach database server`

**Solution:**

```bash
# Check Supabase is running
supabase status

# Restart Supabase
supabase stop && supabase start --ignore-health-check

# Verify DATABASE_URL in .env.local
cat .env.local | grep DATABASE_URL
```

#### 6. Prisma Client Not Generated

**Issue:** `Cannot find module '@prisma/client'`

**Solution:**

```bash
npx prisma generate
```

---

## Code Style

### TypeScript

- Use strict typing
- Avoid `any` (use `unknown` if needed)
- Prefer interfaces over types for objects
- Use readonly where applicable

### React

- Use functional components
- Prefer hooks over class components
- Use `"use client"` directive for client components
- Keep components focused and small

### Naming Conventions

- Components: PascalCase (`ChatPage`, `MessageCard`)
- Files: kebab-case (`chat-page.tsx`, `use-chat.ts`)
- Variables: camelCase (`messageCount`, `isLoading`)
- Constants: UPPER_SNAKE_CASE (`MAX_TOKENS`, `API_BASE_URL`)
- Database tables: snake_case (`mastra_messages`, `model_usage`)

### File Organization

```typescript
// 1. Imports (group by type)
import { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';

// 2. Types/Interfaces
interface Props {
  // ...
}

// 3. Component
export default function Component({ }: Props) {
  // Hooks first
  const [state, setState] = useState();
  const { data } = useChat();

  // Event handlers
  const handleClick = () => {
    // ...
  };

  // Effects
  useEffect(() => {
    // ...
  }, []);

  // Render
  return (
    // JSX
  );
}
```

---

## Testing Strategy (Future)

### Unit Tests

```bash
# Add vitest
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Run tests
npm test
```

### Integration Tests

Test API routes with mock data:

```typescript
import { POST } from "@/app/api/chat/route";

test("chat API returns streaming response", async () => {
	const req = new Request("http://localhost/api/chat", {
		method: "POST",
		body: JSON.stringify({
			messages: [
				{ id: "1", role: "user", parts: [{ type: "text", text: "Hello" }] },
			],
		}),
	});

	const response = await POST(req);
	expect(response.status).toBe(200);
});
```

### E2E Tests

```bash
# Add Playwright
npm install -D @playwright/test

# Run E2E tests
npx playwright test
```

---

## Git Workflow

### Branching Strategy

```bash
main              # Production-ready code
├── develop       # Development branch
    ├── feature/chat-interface
    ├── feature/auth
    └── feature/mastra-agents
```

### Commit Messages

Use conventional commits:

```
feat: add user authentication
fix: resolve streaming race condition
docs: update architecture documentation
refactor: simplify message rendering
style: format code with prettier
test: add unit tests for chat API
chore: update dependencies
```

### Before Committing

```bash
# Check for errors
npm run build

# Format code (if using prettier)
npm run format

# Lint code
npm run lint

# Run tests (when implemented)
npm test
```

---

## Deployment Guide (Future)

### Vercel Deployment

1. Connect GitHub repository to Vercel
2. Add environment variables:
   - `ANTHROPIC_API_KEY`
   - `DATABASE_URL` (production database)
   - Other secrets

3. Configure build settings:

   ```json
   {
   	"buildCommand": "npm run build",
   	"outputDirectory": ".next",
   	"installCommand": "npm install"
   }
   ```

4. Deploy:
   ```bash
   vercel --prod
   ```

### Database Migration

1. Set up production database (Supabase Cloud, Neon, etc.)
2. Update `DATABASE_URL` environment variable
3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

---

## Performance Tips

1. **Minimize Client Bundle:**
   - Use `"use client"` only when needed
   - Server components by default
   - Dynamic imports for heavy components

2. **Database Queries:**
   - Use Prisma `select` to fetch only needed fields
   - Implement pagination for large result sets
   - Use database indexes (already defined in schema)

3. **Streaming:**
   - Already implemented for chat
   - Reduces perceived latency
   - Better user experience

4. **Caching:**
   - Use Next.js built-in caching
   - Consider Redis for session data (future)

---

## Useful Commands Reference

```bash
# Node.js
nvm use                           # Use version from .nvmrc
node --version                    # Check Node.js version

# npm
npm install                       # Install dependencies
npm run dev                       # Start dev server
npm run build                     # Production build
npm run start                     # Production server
npm run lint                      # Lint code

# Prisma
npx prisma generate               # Generate client
npx prisma migrate dev            # Create & apply migration
npx prisma migrate reset          # Reset database
npx prisma studio                 # Open Prisma Studio
npx prisma db push                # Push schema without migration

# Supabase
supabase start                    # Start local instance
supabase stop                     # Stop local instance
supabase status                   # Check status
supabase db reset                 # Reset database

# shadcn/ui
npx shadcn@latest add [component] # Add component
npx shadcn@latest init            # Initialize shadcn

# Docker
open -a Docker                    # Start Docker Desktop
docker ps                         # List running containers
docker logs [container]           # View container logs
```

---

## Resources

### Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Vercel AI SDK](https://ai-sdk.dev/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Internal Docs

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [DATABASE.md](./DATABASE.md) - Schema documentation
- [API.md](./API.md) - API reference

### Learning Resources

- [AI SDK Examples](https://github.com/vercel/ai/tree/main/examples)
- [Next.js App Router Tutorial](https://nextjs.org/learn)
- [Prisma Tutorial](https://www.prisma.io/docs/getting-started)

---

## Getting Help

### Local Documentation

All architecture decisions and technical details are documented in `/llm/*.md` files.

### Community Resources

- Next.js Discord
- Vercel AI SDK GitHub Discussions
- Prisma Community Discord
- Supabase Discord

### Debugging Checklist

1. ✅ Docker running?
2. ✅ Supabase started?
3. ✅ Correct Node.js version (20.18.2)?
4. ✅ Dependencies installed?
5. ✅ `.env.local` configured?
6. ✅ Prisma client generated?
7. ✅ Database migrations applied?
8. ✅ Dev server running?

If all checked and still issues, check terminal logs for specific error messages.

---

## Project Maintenance

### Updating Dependencies

```bash
# Check outdated packages
npm outdated

# Update all dependencies
npm update

# Update specific package
npm install @ai-sdk/react@latest

# Regenerate Prisma Client after updates
npx prisma generate
```

### Database Backups

```bash
# Export schema
npx prisma db pull

# Backup data (production)
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

---

## Contributing

1. Create feature branch from `develop`
2. Make changes with clear commit messages
3. Update documentation if needed
4. Test locally
5. Create pull request
6. Wait for review and CI checks

---

## License

TBD
