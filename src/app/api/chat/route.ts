import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

/**
 * POST /api/chat
 *
 * Handles streaming chat completions with Claude 3.5 Sonnet.
 *
 * Request body:
 * - messages: UIMessage[] - Conversation history in AI SDK v5 format
 * - conversationId?: string - Optional conversation ID for persistence (future)
 * - threadId?: string - Optional thread ID for Mastra memory (future)
 *
 * Response:
 * - Server-Sent Events stream with chat completion
 */
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Validate messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response("Invalid messages array", { status: 400 });
    }

    // Convert UIMessage[] to ModelMessage[] format
    // useChat sends UIMessage format (with parts), but streamText expects ModelMessage format (with content)
    const modelMessages = convertToModelMessages(messages);

    // Model configuration
    const languageModel = anthropic("claude-3-7-sonnet-20250219");
    // Track request start time for metrics
    const startTime = Date.now();

    // Stream the chat completion
    const result = streamText({
      model: languageModel,
      messages: modelMessages,
      system: `You are Lume, an intelligent AI assistant that illuminates complex topics with clarity and insight. You provide thoughtful, accurate, and helpful responses.`,
      temperature: 0.7,
      maxOutputTokens: 4000,
      onFinish: async (event) => {
        // Calculate response time
        const responseTimeMs = Date.now() - startTime;

        // Calculate token costs (Claude 3.5 Sonnet pricing)
        const inputTokens = event.usage.inputTokens || 0;
        const outputTokens = event.usage.outputTokens || 0;
        const inputCost = (inputTokens / 1000) * 0.003;
        const outputCost = (outputTokens / 1000) * 0.015;
        const estimatedCost = inputCost + outputCost;

        // TODO: Save conversation and usage data to database
        // This will be implemented in Phase 2 with full persistence
        //
        // import { prisma } from '@/lib/prisma';
        // import { nanoid } from 'nanoid';
        //
        // await prisma.conversation.upsert({
        //   where: { id: conversationId || nanoid() },
        //   create: {
        //     id: conversationId || nanoid(),
        //     threadId: threadId,
        //     modelId,
        //     modelProvider: 'anthropic',
        //   },
        //   update: {
        //     updatedAt: new Date(),
        //   },
        // });
        //
        // await prisma.modelUsage.create({
        //   data: {
        //     conversationId: conversationId || nanoid(),
        //     modelId,
        //     modelProvider: 'anthropic',
        //     inputTokens,
        //     outputTokens,
        //     totalTokens: event.usage.totalTokens,
        //     estimatedCost,
        //     responseTimeMs,
        //     success: true,
        //   },
        // });

        // Log metrics (development only)
        if (process.env.NODE_ENV === "development") {
          console.log("[Chat API] Completion metrics:", {
            model: languageModel.modelId,
            inputTokens,
            outputTokens,
            totalTokens: event.usage.totalTokens,
            cost: `$${estimatedCost.toFixed(4)}`,
            responseTime: `${responseTimeMs}ms`,
          });
        }
      },
    });

    return result.toUIMessageStreamResponse({
      sendReasoning: true,
    });
  } catch (error) {
    console.error("[Chat API] Error:", error);

    // Return appropriate error response
    if (error instanceof Error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Internal server error", { status: 500 });
  }
}
