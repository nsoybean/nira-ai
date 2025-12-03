# **Nira AI**

An intelligent assistant built for thinking work.

## Overview

Nira AI is a conversational interface that combines multiple leading language models into a single, reliable workspace. Built with Next.js and Prisma, it provides persistent conversations, model flexibility, and a clean interface designed for focused work.

## Features

- **Multi-Model Support** — Switch between Anthropic Claude, OpenAI GPT, and Google Gemini models
- **Persistent Conversations** — All conversations are saved with full history
- **Real-Time Streaming** — Responses stream as they're generated
- **Model Selection** — Choose the right model for each conversation
- **Clean Interface** — Minimal design that stays out of your way

## Tech Stack

- **Framework**: Next.js 16 with React 19
- **Database**: PostgreSQL with Prisma ORM
- **AI SDKs**: Vercel AI SDK with Anthropic, OpenAI, and Google providers
- **UI**: Radix UI primitives with Tailwind CSS
- **State**: React Context for global state management

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- API keys for AI providers (Anthropic, OpenAI, Google)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://..."
ANTHROPIC_API_KEY="..."
OPENAI_API_KEY="..."
GOOGLE_GENERATIVE_AI_API_KEY="..."
```

### Database Setup

```bash
npx prisma generate
npx prisma migrate deploy
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/              # Next.js app router
├── components/       # React components
├── contexts/         # React context providers
├── hooks/            # Custom React hooks
└── lib/              # Utilities and configurations
```

## License

Private
