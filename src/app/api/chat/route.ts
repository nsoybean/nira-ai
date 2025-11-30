import { anthropic } from "@ai-sdk/anthropic";
import {
  streamText,
  convertToModelMessages,
  UIMessage,
  createIdGenerator,
} from "ai";
import { prisma } from "@/lib/prisma";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

/**
 * POST /api/chat
 *
 * Handles streaming chat completions with Claude 3.5 Sonnet.
 * Implements message persistence using Vercel AI SDK UIMessage format.
 *
 * Request body:
 * - messages: UIMessage[] - All messages including the latest user message
 * - conversationId: string - Conversation ID for persistence
 *
 * Response:
 * - Server-Sent Events stream with chat completion
 */
export async function POST(req: Request) {
  try {
    const {
      conversationId,
      message,
    }: { message: UIMessage; conversationId: string } = await req.json();

    // Validate messages
    if (!message || !message?.parts.length) {
      return new Response("Missing messages", { status: 400 });
    }

    // Validate conversation ID
    if (!conversationId) {
      return new Response("Conversation ID is required", { status: 400 });
    }

    // Verify conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return new Response("Conversation not found", { status: 404 });
    }

    // Fetch all existing messages for conversation
    const existingMessages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    // Combine existing messages with the new message
    const allMessages: UIMessage[] = [
      ...existingMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as any,
        parts: msg.parts as any, // Cast to satisfy UIMessage format
      })),
      message,
    ];

    // Convert UIMessage[] to ModelMessage[] format for the AI model
    // useChat sends UIMessage format (with parts), but streamText expects ModelMessage format (with content)
    const modelMessages = convertToModelMessages(allMessages);

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
        // Calculate token costs (Claude 3.7 Sonnet pricing)
        const inputTokens = event.usage.inputTokens || 0;
        const outputTokens = event.usage.outputTokens || 0;
        const inputCost = (inputTokens / 1000) * 0.003;
        const outputCost = (outputTokens / 1000) * 0.015;
        const estimatedCost = inputCost + outputCost;
        const responseTimeMs = Date.now() - startTime;

        try {
          // Track model usage for analytics
          await prisma.modelUsage.create({
            data: {
              conversationId,
              modelId: languageModel.modelId,
              modelProvider: "anthropic",
              inputTokens,
              outputTokens,
              totalTokens:
                event.usage.totalTokens || inputTokens + outputTokens,
              estimatedCost,
              responseTimeMs,
              success: true,
            },
          });

          // Log metrics (development only)
          if (process.env.NODE_ENV === "development") {
            console.log("[Chat API] Completion metrics:", {
              conversationId,
              model: languageModel.modelId,
              inputTokens,
              outputTokens,
              totalTokens: event.usage.totalTokens,
              cost: `$${estimatedCost.toFixed(4)}`,
              responseTime: `${responseTimeMs}ms`,
            });
          }
        } catch (error) {
          console.error("[Chat API] Error tracking usage:", error);
        }
      },
    });

    // Return stream with message persistence
    const response = result.toUIMessageStreamResponse({
      sendReasoning: true,
      generateMessageId: createIdGenerator({
        prefix: "msg",
        size: 16,
      }),
      async onFinish({ messages }) {
        try {
          // Save all messages to database in UIMessage format
          // allMessages includes both user messages and assistant response
          await prisma.message.createMany({
            data: [message, ...messages].map((msg) => ({
              id: msg.id,
              conversationId,
              role: msg.role,
              parts: msg.parts as any,
            })),
            skipDuplicates: true,
          });

          // Update conversation's updatedAt timestamp
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
          });

          if (process.env.NODE_ENV === "development") {
            console.log("[Chat API] Messages saved:", {
              conversationId,
              messagesSaved: allMessages.length,
            });
          }
        } catch (error) {
          console.error("[Chat API] Error saving messages:", error);
          // Don't throw - we still want to return the response to the user
        }
      },
    });

    // Add conversation ID to response headers
    response.headers.set("X-Conversation-Id", conversation.id);

    return response;
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
