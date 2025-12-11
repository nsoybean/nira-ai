# Nira - API Documentation

## Overview

Nira's API layer is built with Next.js 16 API Routes, leveraging the Vercel AI SDK v5 for streaming chat completions. The API is designed for real-time, token-based streaming with support for multiple AI providers.

## Base URL

- **Development:** `http://localhost:3000`
- **Production:** TBD (will be deployed to Vercel)

## Authentication

**Current:** No authentication required (development only)

**Future:** JWT-based authentication with user sessions

## API Endpoints

### POST /api/chat

Stream chat completions with AI models.

#### Endpoint

```
POST /api/chat
```

#### Request Headers

```
Content-Type: application/json
```

#### Request Body

```typescript
{
  messages: UIMessage[]  // AI SDK v5 message format
}
```

**UIMessage Format:**

```typescript
interface UIMessage {
	id: string;
	role: "user" | "assistant" | "system" | "tool";
	parts: MessagePart[];
}

interface MessagePart {
	type: "text" | "tool-call" | "tool-result";
	text?: string;
	toolCallId?: string;
	toolName?: string;
	args?: any;
	result?: any;
}
```

#### Example Request

```json
{
	"messages": [
		{
			"id": "msg_1",
			"role": "user",
			"parts": [
				{
					"type": "text",
					"text": "Hello, Nira! What can you help me with?"
				}
			]
		}
	]
}
```

#### Response

**Content-Type:** `text/event-stream; charset=utf-8`

**Streaming Format:** Server-Sent Events (SSE) with AI SDK v5 transport protocol

**Event Types:**

1. **Text Chunks** (streaming)

```
0:"Hello! I'm Nira, your AI assistant. I can help you with:\n\n"
0:"1. Answering questions\n"
0:"2. Writing and editing\n"
0:"3. Analysis and research\n"
```

2. **Finish Event**

```
d:{"finishReason":"stop"}
```

3. **Error Event**

```
3:{"error":"Internal server error"}
```

#### Status Codes

- `200 OK` - Successful streaming response
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Authentication required (future)
- `429 Too Many Requests` - Rate limit exceeded (future)
- `500 Internal Server Error` - Server error or AI provider error

#### Configuration

```typescript
export const maxDuration = 30; // 30 seconds max execution time
```

#### Current Implementation

**File:** `src/app/api/chat/route.ts`

```typescript
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
	const { messages } = await req.json();

	const result = await streamText({
		model: anthropic("claude-3-5-sonnet-20241022"),
		messages,
		system: `You are Nira, an intelligent AI assistant that illuminates complex topics with clarity and insight.`,
		temperature: 0.7,
		maxTokens: 4000,
	});

	return result.toDataStreamResponse();
}
```

#### Parameters Explained

- **model:** AI model to use (currently Claude 3.5 Sonnet)
- **messages:** Conversation history in AI SDK v5 format
- **system:** System prompt defining assistant behavior
- **temperature:** Randomness (0-1, higher = more creative)
- **maxTokens:** Maximum response length (4000 tokens ≈ 3000 words)

---

## Frontend Integration

### useChat Hook (AI SDK v5)

```typescript
import { useChat } from "@ai-sdk/react";

const {
	messages, // UIMessage[] - conversation history
	status, // 'idle' | 'submitted' | 'streaming' | 'error'
	error, // Error | undefined
	sendMessage, // (message: CreateUIMessage) => void
	stop, // () => void - stop streaming
	regenerate, // () => void - regenerate last response
} = useChat({
	api: "/api/chat", // API endpoint
});
```

### Sending Messages

```typescript
// Manual input state management (v5 doesn't provide it)
const [input, setInput] = useState("");

const handleSubmit = (e: React.FormEvent) => {
	e.preventDefault();
	if (!input.trim()) return;

	sendMessage({
		role: "user",
		parts: [{ type: "text", text: input }],
	});

	setInput("");
};
```

### Rendering Messages

```typescript
messages.map((message) => (
  <div key={message.id}>
    <strong>{message.role}:</strong>
    {message.parts
      .filter((part) => part.type === "text")
      .map((part, i) => (
        <span key={i}>{part.text}</span>
      ))}
  </div>
));
```

### Loading States

```typescript
const isLoading = status === "submitted" || status === "streaming";

<Button disabled={isLoading}>
  {isLoading ? "Generating..." : "Send"}
</Button>
```

---

## AI Provider Configuration

### Current Provider: Anthropic

**Model:** Claude 3.5 Sonnet (20241022)

**Pricing:**

- Input: $0.003 / 1K tokens
- Output: $0.015 / 1K tokens

**Rate Limits:**

- Development: 5 requests/minute (tier 1)
- Production: Tier-based (tier 4 = 4000 requests/minute)

**Environment Variable:**

```env
ANTHROPIC_API_KEY=sk-ant-xxx
```

### Future Providers

#### OpenAI (Planned)

```typescript
import { openai } from "@ai-sdk/openai";

const result = await streamText({
	model: openai("gpt-4o"),
	messages,
	// ...
});
```

**Environment Variable:**

```env
OPENAI_API_KEY=sk-xxx
```

#### Google Gemini (Planned)

```typescript
import { google } from "@ai-sdk/google";

const result = await streamText({
	model: google("gemini-2.0-flash"),
	messages,
	// ...
});
```

**Environment Variable:**

```env
GOOGLE_GENERATIVE_AI_API_KEY=xxx
```

---

## Error Handling

### Client-Side

```typescript
const { error } = useChat();

{error && (
  <div className="error">
    Error: {error.message}
  </div>
)}
```

### Server-Side

```typescript
export async function POST(req: Request) {
	try {
		const { messages } = await req.json();

		// Validate messages
		if (!Array.isArray(messages) || messages.length === 0) {
			return new Response("Invalid messages", { status: 400 });
		}

		const result = await streamText({
			model: anthropic("claude-3-5-sonnet-20241022"),
			messages,
			system: "...",
			temperature: 0.7,
			maxTokens: 4000,
		});

		return result.toDataStreamResponse();
	} catch (error) {
		console.error("Chat API error:", error);
		return new Response("Internal server error", { status: 500 });
	}
}
```

---

## Rate Limiting (Future)

### Planned Implementation

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
	redis: Redis.fromEnv(),
	limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
});

export async function POST(req: Request) {
	const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
	const { success } = await ratelimit.limit(ip);

	if (!success) {
		return new Response("Too many requests", { status: 429 });
	}

	// Continue with chat logic...
}
```

**Configuration:**

- Anonymous users: 10 requests/minute
- Authenticated users: 50 requests/minute
- Premium users: 200 requests/minute

---

## Streaming Protocol

### AI SDK v5 Transport Format

The API uses Vercel AI SDK's streaming protocol with prefixed chunks:

```
0:"text chunk"           # Streaming text
1:{"tool":"call"}        # Tool call
2:{"tool":"result"}      # Tool result
3:{"error":"message"}    # Error
d:{"finishReason":"..."}  # Done
e:{"error":"..."}        # Fatal error
```

### Client Parsing

The `useChat` hook automatically handles parsing. For custom implementations:

```typescript
const response = await fetch("/api/chat", {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify({ messages }),
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
	const { done, value } = await reader.read();
	if (done) break;

	const chunk = decoder.decode(value);
	// Parse chunk based on prefix (0:, d:, etc.)
}
```

---

## Token Usage Tracking (Future)

### Implementation Plan

```typescript
export async function POST(req: Request) {
	const startTime = Date.now();
	const { messages } = await req.json();

	const result = await streamText({
		model: anthropic("claude-3-5-sonnet-20241022"),
		messages,
		system: "...",
		temperature: 0.7,
		maxTokens: 4000,
		onFinish: async (event) => {
			const responseTime = Date.now() - startTime;

			// Track usage in database
			await prisma.modelUsage.create({
				data: {
					conversationId: req.headers.get("x-conversation-id"),
					modelId: "claude-3-5-sonnet-20241022",
					modelProvider: "anthropic",
					inputTokens: event.usage.promptTokens,
					outputTokens: event.usage.completionTokens,
					totalTokens: event.usage.totalTokens,
					estimatedCost: calculateCost(event.usage),
					responseTimeMs: responseTime,
					success: true,
				},
			});
		},
	});

	return result.toDataStreamResponse();
}
```

---

## Model Selection (Future)

### Multi-Model Support

```typescript
export async function POST(req: Request) {
	const { messages, model = "claude-3-5-sonnet" } = await req.json();

	const modelConfig = {
		"claude-3-5-sonnet": anthropic("claude-3-5-sonnet-20241022"),
		"gpt-4o": openai("gpt-4o"),
		"gemini-flash": google("gemini-2.0-flash"),
	};

	const result = await streamText({
		model: modelConfig[model] || modelConfig["claude-3-5-sonnet"],
		messages,
		// ...
	});

	return result.toDataStreamResponse();
}
```

### Request Format

```json
{
  "messages": [...],
  "model": "claude-3-5-sonnet"
}
```

---

## Conversation Persistence (Future)

### Save Conversation Flow

```typescript
export async function POST(req: Request) {
	const { messages, conversationId } = await req.json();

	// Get or create conversation
	const conversation = await prisma.conversation.upsert({
		where: { id: conversationId },
		create: {
			id: conversationId,
			modelId: "claude-3-5-sonnet-20241022",
			modelProvider: "anthropic",
			title: generateTitle(messages),
		},
		update: {
			updatedAt: new Date(),
		},
	});

	// Get or create Mastra thread
	let thread = await prisma.mastraThread.findFirst({
		where: { id: conversation.threadId },
	});

	if (!thread) {
		thread = await prisma.mastraThread.create({
			data: {
				title: conversation.title,
			},
		});

		await prisma.conversation.update({
			where: { id: conversationId },
			data: { threadId: thread.id },
		});
	}

	// Save user message
	const userMessage = messages[messages.length - 1];
	await prisma.mastraMessage.create({
		data: {
			threadId: thread.id,
			content: userMessage,
			role: userMessage.role,
			type: "text",
		},
	});

	// Stream AI response and save it
	const result = await streamText({
		model: anthropic("claude-3-5-sonnet-20241022"),
		messages,
		onFinish: async (event) => {
			await prisma.mastraMessage.create({
				data: {
					threadId: thread.id,
					content: {
						id: nanoid(),
						role: "assistant",
						parts: [{ type: "text", text: event.text }],
					},
					role: "assistant",
					type: "text",
				},
			});
		},
	});

	return result.toDataStreamResponse();
}
```

---

## Testing

### Example cURL Request

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "id": "msg_1",
        "role": "user",
        "parts": [
          {
            "type": "text",
            "text": "Hello, Nira!"
          }
        ]
      }
    ]
  }'
```

### Frontend Test

Visit: http://localhost:3000/chat

Type a message and verify:

1. Message appears in UI
2. Loading state shows
3. Response streams in real-time
4. Response completes successfully

---

## Performance Considerations

1. **Streaming:** Reduces perceived latency vs. waiting for full response
2. **Max Duration:** 30 seconds to prevent long-running requests
3. **Token Limits:** 4000 tokens max to control costs
4. **Connection Pooling:** Required in production (Prisma + database)

---

## Security Checklist

- [ ] Add authentication (JWT)
- [ ] Implement rate limiting
- [ ] Validate message content (length, format)
- [ ] Sanitize user input
- [ ] Add CORS restrictions
- [ ] Use environment variables for secrets
- [ ] Implement request logging
- [ ] Add abuse detection

---

## Monitoring & Logging

**Future Implementation:**

- Request/response logging
- Error tracking (Sentry)
- Token usage analytics
- Response time metrics
- Provider status monitoring

---

## References

- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs)
- [AI SDK Streaming Protocol](https://ai-sdk.dev/docs/concepts/streaming)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Anthropic API Reference](https://docs.anthropic.com/en/api)
